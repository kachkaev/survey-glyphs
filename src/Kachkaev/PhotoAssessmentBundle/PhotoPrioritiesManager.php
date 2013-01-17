<?php
namespace Kachkaev\PhotoAssessmentBundle;
use Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoResponseStatus;

use Kachkaev\PhotoAssessmentBundle\Entity\UserStat;
use Kachkaev\PhotoAssessmentBundle\Entity\PhotoStat;
use Doctrine\ORM\EntityManager;

class PhotoPrioritiesManager
{
    protected $em;
    protected $sm;

    public function __construct(EntityManager $em, StatsManager $sm)
    {
        $this->em = $em;
        $this->sm = $sm;
    }
    
    public function updatePhotoPriorities($statsTimestamp)
    {
        // Get stats
        $queryStr = "SELECT ps FROM KachkaevPhotoAssessmentBundle:PhotoStat ps WHERE ps.timestamp = ?1";
        $photoStats = $this->em
            ->createQuery($queryStr)
            ->setParameter(1, $statsTimestamp)
            ->getResult();
         
        // Check if stats exist for a given timestamp
        if (count($photoStats) == 0) {
            throw new \LogicException(sprintf('You should calculate the statistics for timestamp %d first before updating photo priorities based on it', $statsTimestamp));    
        };
        
        // Set all priorities to null
        $this->resetPhotoPriorities();
        
        // Set priorities of photos that have complete responses to that value * -1 (photos with fewer responses get higher priority)
        $updatePriorityStmt = $this->em->getConnection()->prepare("UPDATE Photo SET priority = ? WHERE id = ?");
        foreach($photoStats as $photoStat) {
            $priority = - ($photoStat->get('responsesCount_COMPLETE') + $photoStat->get('responsesCount_PHOTO_PROBLEM')); 
            $updatePriorityStmt->bindValue(1, $priority);
            $updatePriorityStmt->bindValue(2, $photoStat->get('photo')->getId());
            $updatePriorityStmt->execute();
        }
    }

    public function resetPhotoPriorities()
    {
        $stmt = $this->em->getConnection()
            ->query("UPDATE Photo SET priority = 0");
        $stmt->execute();
        
    }
}