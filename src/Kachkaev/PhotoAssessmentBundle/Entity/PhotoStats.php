<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class PhotoStats extends AbstractStandardEntity
{
    protected $standardProperties = ["responsesCount_UNANSWERED",
            "responsesCount_INCOMPLETE", "responsesCount_COMPLETE",
            "responsesCount_PHOTO_PROBLEM", "medianDuration"];
    protected $standardGetters = ["user", "timestamp"];
    
    /**
     * @ORM\ManyToOne(targetEntity="Photo", inversedBy="stats")
     * @ORM\Id
     * @ORM\JoinColumn(name="photoId", referencedColumnName="id")
     */
    protected $photo;

    /** @ORM\Column(type="integer")
     *  @ORM\Id
     */
    protected $timestamp;

    /** @ORM\Column(type="integer")
     */
    protected $statusCount_ALL;
    
    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_UNANSWERED;

    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_INCOMPLETE;

    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_COMPLETE;

    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_PHOTO_PROBLEM;
    
    /** @ORM\Column(type="float")
     */
    protected $medianDuration;
    
    public function __construct(Photo $photo, $timestamp) {
        $this->timestamp = $timestamp;
        $this->photo = $photo;
    }

}
