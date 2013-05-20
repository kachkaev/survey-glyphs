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
            "responsesCount_PHOTO_PROBLEM", "medianDuration",
            "qIsRealPhotoNormalizedAvg", "qIsRealPhotoNormalizedMed", "qIsRealPhotoNormalizedAgr",
            "qIsOutdoorsNormalizedAvg", "qIsOutdoorsNormalizedMed", "qIsOutdoorsNormalizedAgr",
            "qTimeOfDayNormalizedAvg", "qTimeOfDayNormalizedMed", "qTimeOfDayNormalizedAgr",
            "qSubjectTemporalNormalizedAvg", "qSubjectTemporalNormalizedMed", "qSubjectTemporalNormalizedAgr",
            "qSubjectPeopleNormalizedAvg", "qSubjectPeopleNormalizedMed", "qSubjectPeopleNormalizedAgr",
            "qLocationCorrectNormalizedAvg", "qLocationCorrectNormalizedMed", "qLocationCorrectNormalizedAgr",
            "qIsByPedestrianNormalizedAvg", "qIsByPedestrianNormalizedMed", "qIsByPedestrianNormalizedAgr",
            "qIsSpaceAttractiveNormalizedAvg", "qIsSpaceAttractiveNormalizedMed", "qIsSpaceAttractiveNormalizedAgr"
            ];
    protected $standardGetters = ["photo", "timestamp"];
    
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
    

    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsRealPhotoNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsRealPhotoNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsRealPhotoNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsOutdoorsNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsOutdoorsNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsOutdoorsNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qTimeOfDayNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qTimeOfDayNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qTimeOfDayNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qSubjectTemporalNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qSubjectTemporalNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qSubjectTemporalNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qSubjectPeopleNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qSubjectPeopleNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qSubjectPeopleNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsLocationCorrectNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsLocationCorrectNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsLocationCorrectNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsByPedestrianNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsByPedestrianNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsByPedestrianNormalizedAgr = null;


    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsSpaceAttractiveNormalizedAvg = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsSpaceAttractiveNormalizedMed = null;
    /** @ORM\Column(type="integer", nullable=true)
     */
    protected $qIsSpaceAttractiveNormalizedAgr = null;
    
    
    /** @ORM\Column(type="float", nullable=true)
     */
    protected $medianDuration;
    
    public function __construct(Photo $photo, $timestamp) {
        $this->timestamp = $timestamp;
        $this->photo = $photo;
    }

}
