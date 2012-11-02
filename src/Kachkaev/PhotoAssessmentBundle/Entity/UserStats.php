<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class UserStats extends AbstractStandardEntity
{
    protected $standardProperties = ["responsesCount_UNANSWERED",
            "responsesCount_INCOMPLETE", "responsesCount_COMPLETE",
            "responsesCount_PHOTO_PROBLEM", "medianDuration"];
    protected $standardGetters = ["user", "timestamp"];

    /**
     * @ORM\ManyToOne(targetEntity="User", inversedBy="stats")
     * @ORM\JoinColumn(name="userId", referencedColumnName="id")
     * @ORM\Id
     */
    protected $user;

    /** @ORM\Column(type="integer")
     *  @ORM\Id
     */
    protected $timestamp;

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
    
    public function __construct(User $user, $timestamp)
    {
        $this->timestamp = $timestamp;
        $this->user = $user;
    }
}
