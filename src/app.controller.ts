import { Controller, Get, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { Public } from './public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('reset-password')
  @Public()
  resetPasswordPage(@Query('token') token: string, @Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Réinitialiser le mot de passe</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }

          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
          }

          input {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }

          button {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }

          button:hover {
            background-color: #0056b3;
          }

          h2 {
            text-align: center;
            margin-top: 0;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <h2>Réinitialiser votre mot de passe</h2>

          <form id="resetForm">
            <input type="hidden" id="token" />

            <input
              type="password"
              id="newPassword"
              placeholder="Nouveau mot de passe"
              required
            />

            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirmer le nouveau mot de passe"
              required
            />

            <button type="submit">
              Réinitialiser le mot de passe
            </button>
          </form>
        </div>

        <script>
          function getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
          }

          const token = getUrlParameter("token");

          if (!token) {
            document.body.innerHTML = \`
              <div style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; text-align: center;">
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px;">
                  <h2 style="margin-top: 0;">Jeton manquant</h2>

                  <p>
                    Le jeton de réinitialisation de mot de passe est manquant.
                  </p>

                  <p>
                    Veuillez vérifier que vous avez suivi le lien complet envoyé par e-mail.
                  </p>

                  <a
                    href="/"
                    style="color: #007bff; text-decoration: none;"
                  >
                    Retour à l'accueil
                  </a>
                </div>
              </div>
            \`;

            throw new Error("Jeton manquant dans l URL");
          }

          document.getElementById("token").value = token;

          document
            .getElementById("resetForm")
            .addEventListener("submit", async function (e) {
              e.preventDefault();

              const token =
                document.getElementById("token").value;

              const newPassword =
                document.getElementById("newPassword").value;

              const confirmPassword =
                document.getElementById("confirmPassword").value;

              if (newPassword !== confirmPassword) {
                alert("Les mots de passe ne correspondent pas !");
                return;
              }

              if (newPassword.length < 6) {
                alert(
                  "Le mot de passe doit contenir au moins 6 caractères"
                );
                return;
              }

              try {
                const response = await fetch(
                  "http://localhost:3000/auths/reset-password",
                  {
                    method: "POST",

                    headers: {
                      "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                      token: token,
                      newPassword: newPassword,
                    }),
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  alert("Mot de passe réinitialisé avec succès !");

                  window.location.href =
                    "http://localhost:3000/";
                } else {
                  alert(
                    "Erreur : " +
                      (result.message ||
                        "Impossible de réinitialiser le mot de passe")
                  );
                }
              } catch (error) {
                console.error("Erreur :", error);

                alert(
                  "Une erreur s est produite : " + error.message
                );
              }
            });
        </script>
      </body>
      </html>
    `;

    res.send(html);
  }
}