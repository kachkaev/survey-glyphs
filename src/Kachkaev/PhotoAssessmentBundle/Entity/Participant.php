<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class Participant extends AbstractStandardEntity {
	protected $standardProperties = array("source", "id", "status");

	/** @ORM\Column(type="int", nullable=true)
	 *  @ORM\Id()
	 */
	protected $id;

	/** @ORM\Column(type="int", nullable=false)
	 */
	protected $status = 0;
}
