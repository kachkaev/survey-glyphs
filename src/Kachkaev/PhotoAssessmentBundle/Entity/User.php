<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class User extends AbstractStandardEntity implements UserInterface {
	protected $standardProperties = array("source", "id", "status");
	protected $standardGetters = array("responses");

	/** @ORM\Column(type="integer")
     *  @ORM\Id
     *  @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;
	
	/** @ORM\OneToMany(targetEntity="PhotoResponse", mappedBy="user", cascade={"all"})
	*/
	protected $responses;
	
	/** @ORM\Column(type="integer", nullable=false)
	 */
	protected $status = 0;

    public function __construct()
    {
        parent::__construct();
        $this->responses = new \Doctrine\Common\Collections\ArrayCollection();
    }
	
	/**
	 * @inheritDoc
	 */
	public function getRoles() {
		return array('ROLE_PARTICIPANT');
	}
	
	/**
	 * @inheritDoc
	 */
	public function getPassword() {
		return "";
	}
	
	/**
	 * @inheritDoc
	 */
	public function getSalt() {
		return "";
	}
	
	/**
	 * @inheritDoc
	 */
	public function getUsername() {
		return $this->id;
	}
	
	/**
	 * @inheritDoc
	 */
	public function eraseCredentials() {
	}
	
	/**
	 * @inheritDoc
	 */
	public function equals(UserInterface $user) {
		return $user->getUsername() == $this->getUsername();
	}
}
