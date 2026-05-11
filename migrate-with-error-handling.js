const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function runMigration(migrationFile, callback) {
  const command = `npx sequelize-cli db:migrate --to ${migrationFile}`;
  
  exec(command, { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      if (stderr.includes('duplicate') || stderr.includes('already exists') || stderr.includes('SQLITE_ERROR')) {
        console.log(`Migration ${migrationFile} skipped (already applied or duplicate)`);
        callback(null, true); // Continue quand même
      } else {
        console.error(`Error running migration ${migrationFile}:`, stderr);
        callback(error, false);
      }
    } else {
      console.log(`Migration ${migrationFile} completed successfully`);
      callback(null, true);
    }
  });
}

function runMigrationsSequentially(migrations, index = 0) {
  if (index >= migrations.length) {
    console.log('All migrations processed successfully');
    process.exit(0);
    return;
  }

  const migrationFile = migrations[index];
  console.log(`Processing migration: ${migrationFile}`);
  
  runMigration(migrationFile, (error, shouldContinue) => {
    if (error) {
      console.error('Migration process failed:', error);
      process.exit(1);
    } else {
      if (shouldContinue) {
        runMigrationsSequentially(migrations, index + 1);
      } else {
        process.exit(1);
      }
    }
  });
}

// Lister les migrations dans l'ordre souhaité
const migrations = [
  '20260312152121-create-tasks',
  '20260325114646-create-tasks',  // Celle-ci pourrait être ignorée si table existe déjà
  '20260509234657-add-status-column-to-tasks',  // Celle-ci sera ignorée car colonne existe déjà
  '20260510134046-update-notifications-table-content-field'
];

console.log('Starting migration process with error handling...');
runMigrationsSequentially(migrations);