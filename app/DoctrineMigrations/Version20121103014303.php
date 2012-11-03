<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * Changed nullable for median duration, renamed statuscount to responsescount
 */
class Version20121103014303 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql");
        
        $this->addSql("ALTER TABLE PhotoStat CHANGE medianDuration medianDuration DOUBLE PRECISION DEFAULT NULL");
        $this->addSql("ALTER TABLE UserStat ADD statusCount_ALL INT NOT NULL, CHANGE medianDuration medianDuration DOUBLE PRECISION DEFAULT NULL");
        $this->addSql("ALTER TABLE PhotoStat CHANGE statuscount_all responsesCount_ALL INT NOT NULL");
        $this->addSql("ALTER TABLE UserStat CHANGE statuscount_all responsesCount_ALL INT NOT NULL");
    }

    public function down(Schema $schema)
    {
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql");
        
        $this->addSql("ALTER TABLE PhotoStat CHANGE medianDuration medianDuration DOUBLE PRECISION NOT NULL");
        $this->addSql("ALTER TABLE UserStat DROP statusCount_ALL, CHANGE medianDuration medianDuration DOUBLE PRECISION NOT NULL");
        $this->addSql("ALTER TABLE PhotoStat CHANGE responsescount_all statusCount_ALL INT NOT NULL");
        $this->addSql("ALTER TABLE UserStat CHANGE responsescount_all statusCount_ALL INT NOT NULL");
    }
}
