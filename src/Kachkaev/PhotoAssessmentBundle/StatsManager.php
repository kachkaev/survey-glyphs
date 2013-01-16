<?php
namespace Kachkaev\PhotoAssessmentBundle;
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
        $queryPhotoResponses = "SELECT pr, user FROM KachkaevPhotoAssessmentBundle:PhotoResponse pr LEFT JOIN pr.user user WHERE pr.submittedAt <= $timestamp AND user.status = 0";
        $photoResponses = $this->em->createQuery($queryPhotoResponses)
                ->getResult();

        $photoStats = array();
        $userStats = array();

        // Getting list of questions in PhotoResponse
        $refl = new \ReflectionClass(
                'Kachkaev\PhotoAssessmentBundle\Entity\PhotoResponse');
        $questions = array();
        foreach ($refl->getProperties() as $property) {
            if ($property->name[0] == 'q') {
                $questions[] = $property->name;
            }
        }

        // Extracting stats
        foreach ($photoResponses as $photoResponse) {
            $photoId = $photoResponse->getPhoto()->getId();
            $userId = $photoResponse->getUser()->getId();

            // Creating a stat entity for photo if it is new
            if (!array_key_exists($photoId, $photoStats)) {
                $photoStats[$photoId] = array();
                $photoStats[$photoId]['entity'] = new PhotoStat(
                        $photoResponse->getPhoto(), $timestamp);
                $photoStats[$photoId]['durations'] = array();
                $photoStats[$photoId]['answers'] = array();

                foreach ($questions as $question) {
                    $photoStats[$photoId]['answers'][$question] = array();
                }
            }

            // Creating a stat entity for user if it is new
            if (!array_key_exists($userId, $userStats)) {
                $userStats[$userId] = array();
                $userStats[$userId]['entity'] = new UserStat(
                        $photoResponse->getUser(), $timestamp);
                $userStats[$userId]['durations'] = array();
            }

            $photoStat = &$photoStats[$photoId];
            $userStat = &$userStats[$userId];
            $photoStatEntity = $photoStat['entity'];
            $userStatEntity = $userStat['entity'];

            $status = $photoResponse->getStatus();
            $statusAsString = PhotoResponseStatus::valueToString($status);

            $photoStatEntity
                    ->set('responsesCount_ALL',
                            $photoStatEntity->get('responsesCount_ALL') + 1);
            $photoStatEntity
                    ->set('responsesCount_' . $statusAsString,
                            $photoStatEntity
                                    ->get('responsesCount_' . $statusAsString)
                                    + 1);
            $userStatEntity
                    ->set('responsesCount_ALL',
                            $userStatEntity->get('responsesCount_ALL') + 1);
            $userStatEntity
                    ->set('responsesCount_' . $statusAsString,
                            $userStatEntity
                                    ->get('responsesCount_' . $statusAsString)
                                    + 1);

            foreach ($questions as $question) {
                $photoStat['answers'][$question][] = $photoResponse
                        ->get($question);
            }

            $duration = $photoResponse->getDuration();
            if ($duration) {
                array_push($photoStat['durations'], $duration);
                array_push($userStat['durations'], $duration);
            }
        }

        // Calculating aggregations
        //// PhotoStat
        foreach ($photoStats as $photoStat) {
            $photoStat['entity']
                    ->setMedianDuration(
                            calculate_median($photoStat['durations']));
        }
        //// UserStat
        foreach ($userStats as $userStat) {
            $userStat['entity']
                    ->setMedianDuration(
                            calculate_median($userStat['durations']));
        }

        // Wiping off old stats
        $this->delete($timestamp);

        // Saving new stats
        foreach ($photoStats as $photoStat) {
            $this->em->persist($photoStat['entity']);
        }
        foreach ($userStats as $userStat) {
            $this->em->persist($userStat['entity']);
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
                ->query("SELECT DISTINCT(timestamp) FROM PhotoStat ORDER BY timestamp");
        $timestampStmt->execute();
        $timestamps = $timestampStmt->fetchAll(\PDO::FETCH_COLUMN, 0);
        return $timestamps;
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

// http://www.php.net/manual/en/ref.math.php#55173
function calculate_median($arr)
{
    $count = count($arr); //total numbers in array
    if ($count === 0)
        return null;
    sort($arr);
    $middleval = floor(($count - 1) / 2); // find the middle value, or the lowest middle value
    if ($count % 2) { // odd number, middle is the median
        $median = $arr[$middleval];
    } else { // even number, calculate avg of 2 medians
        $low = $arr[$middleval];
        $high = $arr[$middleval + 1];
        $median = (($low + $high) / 2);
    }
    return $median;
}