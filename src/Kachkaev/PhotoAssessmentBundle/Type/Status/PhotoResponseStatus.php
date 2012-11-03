<?php
namespace Kachkaev\PhotoAssessmentBundle\Type\Status;

class PhotoResponseStatus {
	const UNANSWERED = 0;
	const INCOMPLETE = 1;
	const COMPLETE = 2;
	
	const PHOTO_PROBLEM = 0x10;
	
	static protected $constantsTable;
	
	public static function valueToString($value) {
	    static::generateConstantsTableIfNeeded();
	    $result = static::$constantsTable[$value];
	    if (!$result) {
	        throw new InvalidArgumentException('Wrong value given: '.var_export($value, true). ' - expected '. implode(', ', array_keys(static::$constantsTable)));
	    }
	    return $result;
	}
	
	public static function getListOfValues() {
	    static::generateConstantsTableIfNeeded();
	    return $constantsTable;
	}
	
	protected static function generateConstantsTableIfNeeded() {
	    if (!static::$constantsTable) {
	        $refl = new \ReflectionClass('Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoResponseStatus');
	        static::$constantsTable = array_flip($refl->getConstants());
	    }
	}
}