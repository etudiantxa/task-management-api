import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'typeorm';

describe('Register (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get(Connection);
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  afterEach(async () => {
    // Nettoyer les données après chaque test
    await connection.query('DELETE FROM user WHERE username = "testuser123" OR email = "testuser@example.com"');
  });

  it('/auths/register (POST) - should register a new user', async () => {
    const userData = {
      nom: 'Test',
      prenom: 'User',
      email: 'testuser@example.com',
      password: 'Test1234!',
      username: 'testuser123'
    };

    const response = await request(app.getHttpServer())
      .post('/api/auths/register')
      .send(userData)
      .expect(200);

    // Vérifier que la réponse contient un jeton d'accès et les données utilisateur
    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.nom).toBe('Test');
    expect(response.body.user.prenom).toBe('User');
    expect(response.body.user.email).toBe('testuser@example.com');
    expect(response.body.user.username).toBe('testuser123');

    // Vérifier que le mot de passe est haché (pas en clair dans la base)
    const userRepository = connection.getRepository('user');
    const storedUser = await userRepository.findOne({ where: { username: 'testuser123' } });
    expect(storedUser).toBeDefined();
    expect(storedUser['password']).not.toBe(userData.password); // Le mot de passe doit être haché
  });

  it('/auths/register (POST) - should fail to register user with weak password', async () => {
    const invalidUserData = {
      nom: 'Test',
      prenom: 'User',
      email: 'anothertest@example.com',
      password: 'weak', // Mot de passe trop faible
      username: 'anothertest123'
    };

    await request(app.getHttpServer())
      .post('/api/auths/register')
      .send(invalidUserData)
      .expect(400); // Devrait échouer à cause de la validation
  });

  it('/auths/register (POST) - should fail to register user with short name', async () => {
    const invalidUserData = {
      nom: 'A', // Nom trop court
      prenom: 'User',
      email: 'thirdtest@example.com',
      password: 'Test1234!',
      username: 'thirdtest123'
    };

    await request(app.getHttpServer())
      .post('/api/auths/register')
      .send(invalidUserData)
      .expect(400); // Devrait échouer à cause de la validation
  });

  it('/auths/register (POST) - should register user without email', async () => {
    const userData = {
      nom: 'TestNoEmail',
      prenom: 'UserNoEmail',
      password: 'Test1234!',
      username: 'testnoemail123'
    };

    const response = await request(app.getHttpServer())
      .post('/api/auths/register')
      .send(userData)
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.nom).toBe('TestNoEmail');
    expect(response.body.user.prenom).toBe('UserNoEmail');
    expect(response.body.user.username).toBe('testnoemail123');
    // L'email devrait être undefined car optionnel
    expect(response.body.user.email).toBeNull();
  });
});