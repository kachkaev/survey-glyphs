<?php
namespace Kachkaev\PhotoAssessmentBundle\Stats;
use Doctrine\ORM\EntityManager;

class StatsManager
{
    protected $em;
    
    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function calculate($timestamp = null)
    {
        //TODO implement method
    }

    public function delete($timestamp = null)
    {
        $queryPhotoStats = "DELETE FROM KachkaevPhotoAssessmentBundle:PhotoStats";
        $queryUserStats = "DELETE FROM KachkaevPhotoAssessmentBundle:UserStats";
        
        if (is_int($timestamp) && $timestamp >= 0) {
            $queryPhotoStats .= " WHERE timestamp = $timestamp"; 
            $queryUserStats  .= " WHERE timestamp = $timestamp"; 
        } elseif (!is_null($timestamp)) {
            throw new InvalidArgumentException("Wrong value for timestamp: ".var_export($timestamp, true));
        }
        
        $this->em->createQuery($queryPhotoStats)->execute();
        $this->em->createQuery($queryUserStats)->execute();

    }
}
