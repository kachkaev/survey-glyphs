<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class PhotoSurvey extends AbstractStandardEntity {
	protected $standardProperties = ["source", "id", "status"];
	protected $standardGetters = ["id"];

	/** @ORM\Column(type="int", nullable=true, length=128)
	 *  @ORM\Id()
	 */
	protected $id;

	/** @ORM\Column(type="string", nullable=true, length=128)
	 */
	protected $source;

	/** @ORM\Column(type="string", nullable=true, length=128)
	 */
	protected $photoId;

	/** @ORM\Column(type="int", nullable=false)
	 */
	protected $status = 0;
}
