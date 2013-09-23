<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * Add qXXXMed, qXXXAvg and qXXXAgr to PhotoStat
 */
class Version20130520121316 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE PhotoStat ADD qIsRealPhotoNormalizedAvg INT DEFAULT NULL, ADD qIsRealPhotoNormalizedMed INT DEFAULT NULL, ADD qIsRealPhotoNormalizedAgr INT DEFAULT NULL, ADD qIsOutdoorsNormalizedAvg INT DEFAULT NULL, ADD qIsOutdoorsNormalizedMed INT DEFAULT NULL, ADD qIsOutdoorsNormalizedAgr INT DEFAULT NULL, ADD qTimeOfDayNormalizedAvg INT DEFAULT NULL, ADD qTimeOfDayNormalizedMed INT DEFAULT NULL, ADD qTimeOfDayNormalizedAgr INT DEFAULT NULL, ADD qSubjectTemporalNormalizedAvg INT DEFAULT NULL, ADD qSubjectTemporalNormalizedMed INT DEFAULT NULL, ADD qSubjectTemporalNormalizedAgr INT DEFAULT NULL, ADD qSubjectPeopleNormalizedAvg INT DEFAULT NULL, ADD qSubjectPeopleNormalizedMed INT DEFAULT NULL, ADD qSubjectPeopleNormalizedAgr INT DEFAULT NULL, ADD qIsLocationCorrectNormalizedAvg INT DEFAULT NULL, ADD qIsLocationCorrectNormalizedMed INT DEFAULT NULL, ADD qIsLocationCorrectNormalizedAgr INT DEFAULT NULL, ADD qIsByPedestrianNormalizedAvg INT DEFAULT NULL, ADD qIsByPedestrianNormalizedMed INT DEFAULT NULL, ADD qIsByPedestrianNormalizedAgr INT DEFAULT NULL, ADD qIsSpaceAttractiveNormalizedAvg INT DEFAULT NULL, ADD qIsSpaceAttractiveNormalizedMed INT DEFAULT NULL, ADD qIsSpaceAttractiveNormalizedAgr INT DEFAULT NULL");
    }

    public function down(Schema $schema)
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE PhotoStat DROP qIsRealPhotoNormalizedAvg, DROP qIsRealPhotoNormalizedMed, DROP qIsRealPhotoNormalizedAgr, DROP qIsOutdoorsNormalizedAvg, DROP qIsOutdoorsNormalizedMed, DROP qIsOutdoorsNormalizedAgr, DROP qTimeOfDayNormalizedAvg, DROP qTimeOfDayNormalizedMed, DROP qTimeOfDayNormalizedAgr, DROP qSubjectTemporalNormalizedAvg, DROP qSubjectTemporalNormalizedMed, DROP qSubjectTemporalNormalizedAgr, DROP qSubjectPeopleNormalizedAvg, DROP qSubjectPeopleNormalizedMed, DROP qSubjectPeopleNormalizedAgr, DROP qIsLocationCorrectNormalizedAvg, DROP qIsLocationCorrectNormalizedMed, DROP qIsLocationCorrectNormalizedAgr, DROP qIsByPedestrianNormalizedAvg, DROP qIsByPedestrianNormalizedMed, DROP qIsByPedestrianNormalizedAgr, DROP qIsSpaceAttractiveNormalizedAvg, DROP qIsSpaceAttractiveNormalizedMed, DROP qIsSpaceAttractiveNormalizedAgr");
    }
}
