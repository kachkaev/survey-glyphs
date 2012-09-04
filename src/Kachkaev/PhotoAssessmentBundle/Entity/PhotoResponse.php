<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class PhotoResponse extends AbstractStandardEntity {
	protected $standardProperties = ["status", "duration", "submittedAt", "qIsRealPhoto",
			"qIsOutdoors", "qDuringEvent", "qTimeOfDay", "qSubjectPerson",
			"qSubjectMovingObject", "qIsLocationCorrect", "alteredLon", "alteredLat", "qDescribesSpace", "qSpaceAttractive"];

	protected $standardGetters = ["id", "user", "photo"];

	/** @ORM\Column(type="integer")
     *  @ORM\Id
     *  @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;
	
	/**
     * @ORM\ManyToOne(targetEntity="Photo", inversedBy="responses")
     * @ORM\JoinColumn(name="photoId", referencedColumnName="id")
     */
	protected $photo;

	/**
     * @ORM\ManyToOne(targetEntity="User", inversedBy="responses")
     * @ORM\JoinColumn(name="userId", referencedColumnName="id")
     */
	protected $user;

	/** @ORM\Column(type="integer", nullable=false)
	 */
	protected $status = 0;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qIsRealPhoto;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qIsOutdoors;

	/** @ORM\Column(type="boolean", nullable=true)
	 */
	protected $qDuringEvent;
	
	/** @ORM\Column(type="integer", nullable=true)
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
	protected $qSpaceAttractive;

	/** @ORM\Column(type="integer", nullable=true)
	 */
	protected $duration;

	/** @ORM\Column(type="datetime", nullable=true)
	 */
	protected $submittedAt;
	
	/** @ORM\Column(type="datetime", nullable=true)
	 */
	protected $statusCheckedAt;
	
	public function __construct(Photo $photo, User $user) {
		parent::__construct();
		$this->photo = $photo;
		$this->user = $user;
	}
	
	public function getSerializableProperties() {
		return $this->standardProperties;
	}
}
