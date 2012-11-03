<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class PhotoStat extends AbstractStandardEntity
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
    protected $responsesCount_ALL = 0;
    
    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_UNANSWERED = 0;

    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_INCOMPLETE = 0;

    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_COMPLETE = 0;

    /** @ORM\Column(type="integer")
     */
    protected $responsesCount_PHOTO_PROBLEM = 0;
    
    /** @ORM\Column(type="float", nullable=true)
     */
    protected $medianDuration;
    
    public function __construct(Photo $photo, $timestamp) {
        $this->timestamp = $timestamp;
        $this->photo = $photo;
    }

}
