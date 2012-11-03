<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * Initial migration
 */
class Version20121031000000 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql");
        
        $this->addSql("CREATE TABLE Photo (id INT AUTO_INCREMENT NOT NULL, source VARCHAR(255) NOT NULL, photoId VARCHAR(255) NOT NULL, userId VARCHAR(255) NOT NULL, userName VARCHAR(255) NOT NULL, lon DOUBLE PRECISION NOT NULL, lat DOUBLE PRECISION NOT NULL, status INT NOT NULL, completeResponsesCount INT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB");
        $this->addSql("CREATE TABLE User (id INT AUTO_INCREMENT NOT NULL, status INT NOT NULL, language VARCHAR(255) DEFAULT NULL, location VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB");
        $this->addSql("CREATE TABLE PhotoResponse (id INT AUTO_INCREMENT NOT NULL, status INT NOT NULL, qIsRealPhoto INT DEFAULT NULL, qIsOutdoors INT DEFAULT NULL, qTimeOfDay INT DEFAULT NULL, qSubjectTemporal INT DEFAULT NULL, qSubjectPeople INT DEFAULT NULL, qIsLocationCorrect INT DEFAULT NULL, alteredLon DOUBLE PRECISION DEFAULT NULL, alteredLat DOUBLE PRECISION DEFAULT NULL, qIsByPedestrian INT DEFAULT NULL, qIsSpaceAttractive INT DEFAULT NULL, duration INT DEFAULT NULL, submissionCount INT DEFAULT NULL, submittedAt DATETIME DEFAULT NULL, statusCheckedAt DATETIME DEFAULT NULL, photoId INT DEFAULT NULL, userId INT DEFAULT NULL, INDEX IDX_35DBD4A842738825 (photoId), INDEX IDX_35DBD4A864B64DCC (userId), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB");
        $this->addSql("ALTER TABLE PhotoResponse ADD CONSTRAINT FK_35DBD4A842738825 FOREIGN KEY (photoId) REFERENCES Photo (id)");
        $this->addSql("ALTER TABLE PhotoResponse ADD CONSTRAINT FK_35DBD4A864B64DCC FOREIGN KEY (userId) REFERENCES User (id)");
    }

    public function down(Schema $schema)
    {
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql");
        
        $this->addSql("ALTER TABLE PhotoResponse DROP FOREIGN KEY FK_35DBD4A842738825");
        $this->addSql("ALTER TABLE PhotoResponse DROP FOREIGN KEY FK_35DBD4A864B64DCC");
        $this->addSql("DROP TABLE PhotoResponse");
        $this->addSql("DROP TABLE Photo");
        $this->addSql("DROP TABLE User");
    }
}
