<?php

namespace Application\Migrations;

use Doctrine\DBAL\Migrations\AbstractMigration,
    Doctrine\DBAL\Schema\Schema;

/**
 * Change type of Add qXXXMed, qXXXAvg and qXXXAgr in PhotoStat from int to float 
 */
class Version20130520130311 extends AbstractMigration
{
    public function up(Schema $schema)
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE PhotoStat CHANGE qIsRealPhotoNormalizedAvg qIsRealPhotoNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qIsRealPhotoNormalizedMed qIsRealPhotoNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qIsRealPhotoNormalizedAgr qIsRealPhotoNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qIsOutdoorsNormalizedAvg qIsOutdoorsNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qIsOutdoorsNormalizedMed qIsOutdoorsNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qIsOutdoorsNormalizedAgr qIsOutdoorsNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qTimeOfDayNormalizedAvg qTimeOfDayNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qTimeOfDayNormalizedMed qTimeOfDayNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qTimeOfDayNormalizedAgr qTimeOfDayNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qSubjectTemporalNormalizedAvg qSubjectTemporalNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qSubjectTemporalNormalizedMed qSubjectTemporalNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qSubjectTemporalNormalizedAgr qSubjectTemporalNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qSubjectPeopleNormalizedAvg qSubjectPeopleNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qSubjectPeopleNormalizedMed qSubjectPeopleNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qSubjectPeopleNormalizedAgr qSubjectPeopleNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qIsLocationCorrectNormalizedAvg qIsLocationCorrectNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qIsLocationCorrectNormalizedMed qIsLocationCorrectNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qIsLocationCorrectNormalizedAgr qIsLocationCorrectNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qIsByPedestrianNormalizedAvg qIsByPedestrianNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qIsByPedestrianNormalizedMed qIsByPedestrianNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qIsByPedestrianNormalizedAgr qIsByPedestrianNormalizedAgr DOUBLE PRECISION DEFAULT NULL, CHANGE qIsSpaceAttractiveNormalizedAvg qIsSpaceAttractiveNormalizedAvg DOUBLE PRECISION DEFAULT NULL, CHANGE qIsSpaceAttractiveNormalizedMed qIsSpaceAttractiveNormalizedMed DOUBLE PRECISION DEFAULT NULL, CHANGE qIsSpaceAttractiveNormalizedAgr qIsSpaceAttractiveNormalizedAgr DOUBLE PRECISION DEFAULT NULL");
    }

    public function down(Schema $schema)
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() != "mysql", "Migration can only be executed safely on 'mysql'.");
        
        $this->addSql("ALTER TABLE PhotoStat CHANGE qIsRealPhotoNormalizedAvg qIsRealPhotoNormalizedAvg INT DEFAULT NULL, CHANGE qIsRealPhotoNormalizedMed qIsRealPhotoNormalizedMed INT DEFAULT NULL, CHANGE qIsRealPhotoNormalizedAgr qIsRealPhotoNormalizedAgr INT DEFAULT NULL, CHANGE qIsOutdoorsNormalizedAvg qIsOutdoorsNormalizedAvg INT DEFAULT NULL, CHANGE qIsOutdoorsNormalizedMed qIsOutdoorsNormalizedMed INT DEFAULT NULL, CHANGE qIsOutdoorsNormalizedAgr qIsOutdoorsNormalizedAgr INT DEFAULT NULL, CHANGE qTimeOfDayNormalizedAvg qTimeOfDayNormalizedAvg INT DEFAULT NULL, CHANGE qTimeOfDayNormalizedMed qTimeOfDayNormalizedMed INT DEFAULT NULL, CHANGE qTimeOfDayNormalizedAgr qTimeOfDayNormalizedAgr INT DEFAULT NULL, CHANGE qSubjectTemporalNormalizedAvg qSubjectTemporalNormalizedAvg INT DEFAULT NULL, CHANGE qSubjectTemporalNormalizedMed qSubjectTemporalNormalizedMed INT DEFAULT NULL, CHANGE qSubjectTemporalNormalizedAgr qSubjectTemporalNormalizedAgr INT DEFAULT NULL, CHANGE qSubjectPeopleNormalizedAvg qSubjectPeopleNormalizedAvg INT DEFAULT NULL, CHANGE qSubjectPeopleNormalizedMed qSubjectPeopleNormalizedMed INT DEFAULT NULL, CHANGE qSubjectPeopleNormalizedAgr qSubjectPeopleNormalizedAgr INT DEFAULT NULL, CHANGE qIsLocationCorrectNormalizedAvg qIsLocationCorrectNormalizedAvg INT DEFAULT NULL, CHANGE qIsLocationCorrectNormalizedMed qIsLocationCorrectNormalizedMed INT DEFAULT NULL, CHANGE qIsLocationCorrectNormalizedAgr qIsLocationCorrectNormalizedAgr INT DEFAULT NULL, CHANGE qIsByPedestrianNormalizedAvg qIsByPedestrianNormalizedAvg INT DEFAULT NULL, CHANGE qIsByPedestrianNormalizedMed qIsByPedestrianNormalizedMed INT DEFAULT NULL, CHANGE qIsByPedestrianNormalizedAgr qIsByPedestrianNormalizedAgr INT DEFAULT NULL, CHANGE qIsSpaceAttractiveNormalizedAvg qIsSpaceAttractiveNormalizedAvg INT DEFAULT NULL, CHANGE qIsSpaceAttractiveNormalizedMed qIsSpaceAttractiveNormalizedMed INT DEFAULT NULL, CHANGE qIsSpaceAttractiveNormalizedAgr qIsSpaceAttractiveNormalizedAgr INT DEFAULT NULL");
    }
}
