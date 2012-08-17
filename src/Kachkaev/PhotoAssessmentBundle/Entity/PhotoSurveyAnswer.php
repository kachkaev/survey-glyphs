<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class PhotoSurveyAnswer extends AbstractStandardEntity {
	protected $standardProperties = ["participant", "qIsRealPhoto",
			"qIsOutdoors", "qIsOnEvent", "qTimeOfDay", "qSubjectPerson",
			"qSubjectMovingObject", "qIsLocationCorrect", "correctedLon", "correctedLon", "qDescribesSpace", "qSpaceAttractive"];

	protected $standardGetters = ["id"];

	/** @ORM\Column(type="string", nullable=true, length=128)
	 */
	protected $id;

	protected $participant;

	/** @ORM\Column(type="string", nullable=true, length=128)
	 */
	protected $photo;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qIsRealPhoto;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qIsOutdoors;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qDuringEvent;
	
	/** @ORM\Column(type="int", nullable=true)
	 */
	protected $qTimeOfDay;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qSubjectPerson;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qSubjectMovingObject;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qIsLocationCorrect;
	
	/** @ORM\Column(type="float", nullable=true)
	 */
	protected $alteredLon;

	/** @ORM\Column(type="float", nullable=true)
	 */
	protected $alteredLat;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qDescribesSpace;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qSpaceScenic;

	/** @ORM\Column(type="int", nullable=false)
	 */
	protected $status = 0;

	/** @ORM\Column(type="int", nullable=true)
	 */
	protected $duration;

	/** @ORM\Column(type="DateTime", nullable=true)
	 */
	protected $submittedAt;
}
