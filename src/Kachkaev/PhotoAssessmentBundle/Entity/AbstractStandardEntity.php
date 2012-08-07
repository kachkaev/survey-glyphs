<?php
namespace Kachkaev\PhotoAssessmentBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/*
 * @see http://www.php.net/manual/en/language.oop5.overloading.php#103478
*/

/** @ORM\MappedSuperclass */
abstract class AbstractStandardEntity
{
	protected $standardProperties;
	protected $standardGetters;

	public function __call($methodName, $args)
	{
		// Method matches property name
		if (property_exists($this, $methodName)) {
			$property = $methodName;
			$localeSuffix = '';
			$this->checkArguments($args, 0, 0, $methodName);

			return $this->get($property);

		// Universal getter and setter
		} elseif (preg_match('~^(set|get)([A-Z])([A-Za-z0-9]*)$~', $methodName, $matches)) {
			$property = strtolower($matches[2]) . $matches[3];

			if (!property_exists($this, $property)) {
				throw new MemberAccessException('Property ' . $property . ' does not exist.');

			// Методы должны работать только для стандартных параметров и параметров со стандартными геттерами
			} else if (!is_array($this->standardProperties) || !in_array($property, $this->standardProperties)) {
				if (is_array($this->standardGetters) && in_array($property, $this->standardGetters)) {
					if ($matches[1] != 'get')
						throw new MemberAccessException('Property ' . $property . ' needs implicidly defined setter.');
				} else {
					throw new MemberAccessException('Property ' . $property . ' needs implicidly defined getter or setter.');
				}
			}

			switch ($matches[1]) {
				case 'set':
					$this->checkArguments($args, 1, 1, $methodName);
					return $this->set($property, $args[0]);
				case 'get':
					$this->checkArguments($args, 0, 0, $methodName);
					return $this->get($property);
			}
		}
		throw new MemberAccessException("Method $methodName is not defined.");
	}

	public function get($property)
	{
		return $this->$property;
	}

	public function set($property, $value)
	{
		$this->$property = $value;
		return $this;
	}

	public function hasProperty($propertyName)
	{
		return property_exists($this, $propertyName);
	}

	protected function checkArguments(array $args, $min, $max, $methodName)
	{
		$argc = count($args);
		if ($argc < $min || $argc > $max) {
			throw new MemberAccessException('Method ' . $methodName . ' needs minimaly ' . $min . ' and maximaly ' . $max . ' arguments. ' . $argc . ' arguments given.');
		}
	}

	protected function checkPropertyExists($propertyName)
	{
		if (!$this->hasProperty($propertyName))
			throw new UntranslatablePropertyException("Property $propertyName does not exist.");
	}

	public function __construct()
	{
	}
}
