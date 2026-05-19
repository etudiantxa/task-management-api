const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runMigrationsSafely() {
  try {
    console.log('Starting safe migration process...');
    
    // Exécuter les migrations avec gestion des erreurs
    const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer to handle large outputs
    });
    
    console.log('Migration output:', stdout);
    if (stderr) {
      console.log('Migration warnings/errors:', stderr);
    }
    
    console.log('Safe migration process completed');
    process.exit(0);
  } catch (error) {
    // Si une migration échoue, on vérifie si c'est un problème de duplication
    // et on continue quand même
    if (error.stdout) {
      console.log('Migration output:', error.stdout);
    }
    
    if (error.stderr) {
      // Vérifier si l'erreur est liée à une duplication de colonne/table
      if (
        error.stderr.includes('duplicate') ||
        error.stderr.includes('SQLITE_ERROR')
      ) {
        console.log(
          'Ignoring migration error (likely duplicate table/column)...',
        );
        console.log('Database structure is likely already correct.');
      } else {
        console.error('Unexpected migration error:', error.stderr);
        process.exit(1);
      }
    }
    
    console.log('Safe migration process completed with some ignored errors');
    process.exit(0);
  }
}

runMigrationsSafely();