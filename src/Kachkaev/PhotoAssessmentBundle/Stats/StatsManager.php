<?php
namespace Kachkaev\PhotoAssessmentBundle\Stats;
use Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoResponseStatus;

use Kachkaev\PhotoAssessmentBundle\Entity\UserStat;
use Kachkaev\PhotoAssessmentBundle\Entity\PhotoStat;
use Doctrine\ORM\EntityManager;

class StatsManager
{
    protected $em;

    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function calculate($timestamp)
    {
        $timestamp = $this->validateTimestamp($timestamp, false);

        // Getting data
        $queryPhotoResponses = "SELECT pr FROM KachkaevPhotoAssessmentBundle:PhotoResponse pr WHERE pr.submittedAt <= $timestamp";
        $photoResponses = $this->em->createQuery($queryPhotoResponses)
                ->getResult();

        $photoStats = array();
        $userStats = array();

        // Calculating stats
        foreach ($photoResponses as $photoResponse) {
            $photoId = $photoResponse->getPhoto()->getId();
            $userId = $photoResponse->getUser()->getId();

            if (!array_key_exists($photoId, $photoStats)) {
                $photoStats[$photoId] = new PhotoStat(
                        $photoResponse->getPhoto(), $timestamp);
            }

            if (!array_key_exists($userId, $userStats)) {
                $userStats[$userId] = new UserStat($photoResponse->getUser(),
                        $timestamp);
            }

            $photoStat = $photoStats[$photoId];
            $userStat = $userStats[$userId];

            $status = PhotoResponseStatus::valueToString(
                    $photoResponse->getStatus());

            $photoStat
                    ->set('responsesCount_ALL',
                            $photoStat->get('responsesCount_ALL') + 1);
            $photoStat
                    ->set('responsesCount_' . $status,
                            $photoStat->get('responsesCount_' . $status) + 1);
            $userStat
                    ->set('responsesCount_ALL',
                            $userStat->get('responsesCount_ALL') + 1);
            $userStat
                    ->set('responsesCount_' . $status,
                            $userStat->get('responsesCount_' . $status) + 1);
        }

        // Wiping off old stats
        $this->delete($timestamp);

        // Saving new stats
        foreach ($photoStats as $photoStat) {
            $this->em->persist($photoStat);
        }
        foreach ($userStats as $userStat) {
            $this->em->persist($userStat);
        }
        $this->em->flush();

    }

    public function delete($timestamp = null)
    {
        $timestamp = $this->validateTimestamp($timestamp);

        $queryPhotoStats = "DELETE FROM KachkaevPhotoAssessmentBundle:PhotoStat ps";
        $queryUserStats = "DELETE FROM KachkaevPhotoAssessmentBundle:UserStat us";

        if (is_int($timestamp)) {
            $queryPhotoStats .= " WHERE ps.timestamp = $timestamp";
            $queryUserStats .= " WHERE us.timestamp = $timestamp";
        }

        $this->em->createQuery($queryPhotoStats)->execute();
        $this->em->createQuery($queryUserStats)->execute();

    }

    public function statsExistFor($timestamp)
    {
        $timestamp = $this->validateTimestamp($timestamp, false);

        $timestampStmt = $this->em->getConnection()
                ->query(
                        "SELECT timestamp from PhotoStat where timestamp = $timestamp LIMIT 1");
        $timestampStmt->execute();
        return sizeof($timestampStmt->fetchAll()) != 0;
    }

    public function listTimestamps()
    {
        $timestampStmt = $this->em->getConnection()
                ->query("SELECT DISTINCT(timestamp) FROM PhotoStat");
        $timestampStmt->execute();
        $timestampRes = $timestampStmt->fetchAll(\PDO::FETCH_COLUMN, 0);
        return $timestampRes;
    }

    protected function validateTimestamp($timestamp, $nullable = true)
    {
        if ((is_int($timestamp)
                || (is_string($timestamp) && $timestamp + 0 == $timestamp))
                && !is_null($timestamp)) {
            return (int) $timestamp;
        } elseif ($nullable && is_null($timestamp)) {
            return null;
        }
        throw new \InvalidArgumentException(
                'Wrong value for timestamp given: '
                        . var_export($timestamp, true) . ' - positive integer '
                        . ($nullable ? 'or null ' : '') . 'expected');
    }
}
