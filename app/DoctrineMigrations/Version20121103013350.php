<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * Renamed stats to stat
 */
class Version20121103013350 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql");

        $this->addSql("RENAME TABLE PhotoStats TO PhotoStat");
        $this->addSql("RENAME TABLE UserStats TO UserStat");
    }

    public function down(Schema $schema)
    {
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql");

        $this->addSql("RENAME TABLE PhotoStat TO PhotoStats");
        $this->addSql("RENAME TABLE UserStat TO UserStats");
            }
}
