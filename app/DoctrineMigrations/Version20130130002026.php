<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * Add statusCheckedAt to User, remove statusCheckedAt from PhotoResponse
 */
class Version20130130002026 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE PhotoResponse DROP statusCheckedAt");
        $this->addSql("ALTER TABLE User ADD statusCheckedAt INT DEFAULT NULL");
    }

    public function down(Schema $schema)
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE PhotoResponse ADD statusCheckedAt DATETIME DEFAULT NULL");
        $this->addSql("ALTER TABLE User DROP statusCheckedAt");
    }
}
