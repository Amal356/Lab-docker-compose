CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo'
);

INSERT INTO tasks (title, description, status) VALUES 
('Comprendre Docker', 'Apprendre les bases des conteneurs', 'done'),
('Configurer Docker Compose', 'Créer le fichier docker-compose.yml', 'in_progress'),
('Déployer en production', 'Mettre en ligne notre application', 'todo');
