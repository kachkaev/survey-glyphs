<?php
namespace Kachkaev\PhotoAssessmentBundle;
use Kachkaev\PhotoAssessmentBundle\Type\Status\UserStatus;

use Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoStatus;

use Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoResponseStatus;

use Kachkaev\PhotoAssessmentBundle\Entity\UserStat;
use Kachkaev\PhotoAssessmentBundle\Entity\PhotoStat;
use Doctrine\ORM\EntityManager;

class StatsManager
{
    protected $em;

    // Main principle of normalization: the bigger the number the less appropriate the photograph
    protected $answerNormalizationMap = [
            '_default'   => ['1' => 0, '0' => 1 , '-1' => 0.5, '' => 2],
            'qTimeOfDay' => ['2' => 1, '1' => 0.75, '0' => 0],
            'qSubjectTemporary' => ['1' => 1, '0' => 0],
            'qSubjectPeople' => ['1' => 1, '0' => 0]
        ];
    
    protected $dependentQuestionDisabling = [
        'qIsRealPhoto' => [
                '0' => ['qIsOutdoors', 'qTimeOfDay', 'qTimeOfYear', 'qSubjectTemporal', 'qSubjectPeople', 'qIsLocationCorrect', 'qIsByPedestrian', 'qIsSpaceAttractive']
            ],
        'qIsOutdoors' => [
                '0' => ['qDuringEvent', 'qTimeOfDay', 'qTimeOfYear', 'qSubjectTemporal', 'qIsLocationCorrect', 'qIsByPedestrian', 'qIsSpaceAttractive']
            ]
        ];
    
    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function calculate($timestamp)
    {
        $timestamp = $this->validateTimestamp($timestamp, false);

        // Getting data
        $queryPhotoResponses = "SELECT pr, user, photo FROM KachkaevPhotoAssessmentBundle:PhotoResponse pr LEFT JOIN pr.photo photo LEFT JOIN pr.user user WHERE pr.submittedAt <= $timestamp AND user.status = 0";
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
            $userId  = $photoResponse->getUser()->getId();

            // Creating a stat entity for photo if it is new
            if (!array_key_exists($photoId, $photoStats)) {
                $photoStats[$photoId] = array();
                //$photoStats[$photoId]['photoId'] = $photoId;
                $photoStats[$photoId]['entity'] = new PhotoStat(
                        $photoResponse->getPhoto(), $timestamp);
                $photoStats[$photoId]['durations'] = array();
                $photoStats[$photoId]['answers'] = array();
                
                foreach ($questions as $question) {
                    $photoStats[$photoId]['answers'][$question] = array();
                    $photoStats[$photoId]['normalized_answers'][$question] = array();
                }
            }
            
            // Creating a stat entity for user if it is new
            if (!array_key_exists($userId, $userStats)) {
                $userStats[$userId] = array();
                //$userStats[$userId]['userId'] = $userId;
                $userStats[$userId]['entity'] = new UserStat(
                        $photoResponse->getUser(), $timestamp);
                $userStats[$userId]['durations'] = array();
            }

            //$photoStat =& $photoStats[$photoId];
            //$userStat  =& $userStats[$userId];
            $photoStat = $photoStats[$photoId];
            $userStat  = $userStats[$userId];
            $photoStatEntity = $photoStat['entity'];
            $userStatEntity  = $userStat['entity'];
            
//             echo $photoId.' '. $userId
//                 . ($photoStat === null) . '.'
//                 . ($userStat === null) . '.'
//                 . ($photoStatEntity === null) . '.'
//                 . ($userStatEntity === null) . "\n";

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

            // Adding the answer to the array of answers if the response status is ok as well
            // as the user is not banned and photo is not rejected
            if ($status == PhotoResponseStatus::COMPLETE
                    && $photoStatEntity->getPhoto()->getStatus() == PhotoStatus::OK
                    && $userStatEntity->getUser()->getStatus() == UserStatus::OK) {
                
                foreach ($questions as $question) {
                    $answer = $photoResponse->get($question);
                    
                    // Check if the answer must be void because an answer to another question disables it
                    // (a rare case when users check "attractive = yes", then choose "outdoors = no")
                    foreach ($this->dependentQuestionDisabling as $disablerQuestionName => $disablerQuestionAnswers) {
                        foreach ($disablerQuestionAnswers as $disablerQuestionAnswer => $disablingQuestions) {
                            if ($photoResponse->get($disablerQuestionName) == $disablerQuestionAnswer) {
                                if (in_array($question, $disablingQuestions)) {
                                    $answer = null;
                                    break 2;
                                }
                            }
                        }
                    }
                    
                    // when questions are disabled they do not affect on the stats
                    // e.g. someone answered ‘outdoors = yes’ and we are looking at ‘attractive = yes/no’
                    //if ($answer === null) { 
                    //    continue;
                    // }
                    $photoStat['answers'][$question][] = $answer;
                    
                    $answerAsStr = $answer === null ? '' : $answer.'';
                    
                    $normalizedAnswer = null;
                    if (array_key_exists($question, $this->answerNormalizationMap)
                            && array_key_exists($answerAsStr, $this->answerNormalizationMap[$question])) {
                        $normalizedAnswer = $this->answerNormalizationMap[$question][$answerAsStr];
                    } else {
                        $normalizedAnswer = $this->answerNormalizationMap['_default'][$answerAsStr];
                    }
                    $photoStat['normalized_answers'][$question][] = $normalizedAnswer;
                }
    
                $duration = $photoResponse->getDuration();
                if ($duration) {
                    array_push($photoStat['durations'], $duration);
                    array_push($userStat['durations'], $duration);
                }
                
                $photoStats[$photoId] = $photoStat;
                $userStats[$userId] = $userStat;
            }
        }
        
        // Calculating aggregations
        //// PhotoStat
        foreach ($photoStats as $photoStat) {
            $photoStatEntity = $photoStat['entity'];
            $photo = $photoStatEntity->getPhoto();
             
            $photoStatEntity->setMedianDuration(
                             calculate_median($photoStat['durations']));
            
            if ($photo->getStatus() == PhotoStatus::OK) {
                foreach ($questions as $question) {
                    $questionAnswers = &$photoStat['normalized_answers'][$question];
                    $avg = calculate_average($questionAnswers);
                    $med = calculate_median($questionAnswers);
                    $agr = null;
                    if ($med !== null) {
                        $agr = $med <= 0.5 ? 0 : ($med <= 1.5 ? 1 : 2);
                    }
                    $photoStat['entity']->set($question.'NormalizedAvg', $avg);
                    $photoStat['entity']->set($question.'NormalizedMed', $med);
                    $photoStat['entity']->set($question.'NormalizedAgr', $agr);
                }
                
            } else {
                foreach ($questions as $question) {
                     $photoStatEntity->set($question.'NormalizedAvg', null);
                     $photoStatEntity->set($question.'NormalizedMed', null);
                     $photoStatEntity->set($question.'NormalizedAgr', null);
                }
            }
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
        foreach ($photoStats as $photoId => $photoStat) {
            //$photoId = $photoStat['photoId'];
            //echo $photoId. "\t".$photoStat['entity']->getPhoto()->getId(). ($photoId != $photoStat['entity']->getPhoto()->getId() ? "\t!" : '') . "\n";
            $this->em->persist($photoStat['entity']);
        }
        foreach ($userStats as $userId => $userStat) {
            //$userId = $userStat['userId'];
            //echo $userId. "\t".$userStat['entity']->getUser()->getId(). ($userId != $userStat['entity']->getUser()->getId() ? "\t!" : '') . "\n";
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

function calculate_average($arr)
{
    if (!count($arr)) {
        return null;
    }
    
    return array_sum($arr) / count($arr);
}