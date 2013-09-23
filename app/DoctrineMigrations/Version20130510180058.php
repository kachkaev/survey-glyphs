<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * facesXXX varchar → longtext
 */
class Version20130510180058 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE Photo DROP faces640, CHANGE faces500 faces500 LONGTEXT DEFAULT NULL, CHANGE faces240 faces240 LONGTEXT DEFAULT NULL, CHANGE faces1024 faces1024 LONGTEXT DEFAULT NULL, CHANGE facesManual facesManual LONGTEXT DEFAULT NULL");
    }

    public function down(Schema $schema)
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE Photo ADD faces640 VARCHAR(255) DEFAULT NULL, CHANGE faces240 faces240 VARCHAR(255) DEFAULT NULL, CHANGE faces500 faces500 VARCHAR(255) DEFAULT NULL, CHANGE faces1024 faces1024 VARCHAR(255) DEFAULT NULL, CHANGE facesManual facesManual VARCHAR(255) DEFAULT NULL");
    }
}
