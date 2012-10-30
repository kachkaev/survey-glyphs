<?php
namespace Kachkaev\PhotoAssessmentBundle\Helper;
use Symfony\Component\HttpFoundation\Response;

use Symfony\Component\HttpFoundation\Request;

use Symfony\Bridge\Doctrine\Security\User\EntityUserProvider;

use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\RememberMe\TokenBasedRememberMeServices;

class UserRememberer
{
    protected $container;
    protected $rememberMeService;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;

        $providerKey = 'main'; // defined in security.yml
        $securityKey = $this->container->getParameter('remember_me_token'); // defined in security.yml

        $userProvider = new EntityUserProvider(
                $this->container->get('doctrine'),
                'Kachkaev\PhotoAssessmentBundle\Entity\User');

        $this->rememberMeService = new TokenBasedRememberMeServices(
                array($userProvider), $securityKey, $providerKey,
                array('path' => '/',
                        'name' => $this->container
                                ->getParameter('remember_me_cookie'),
                        'domain' => null, 'secure' => false,
                        'httponly' => true, 'lifetime' => 315360000,
                        // 10 years
                        'always_remember_me' => true,
                        'remember_me_parameter' => '_remember_me',));
    }

    public function rememberUser($user, $request, $response)
    {
        if ($user
                != $this->container->get('security.context')->getToken()
                        ->getUser()) {

            //$this->forgetUser($request, $response);
            
            $token = new UsernamePasswordToken($user, null, 'main',
                    $user->getRoles());
        
            $this->container->get('security.context')->setToken($token);

            // write cookie for persistent session storing
            $this->rememberMeService->loginSuccess($request, $response, $token);
        }
    }

    public function forgetUser(Request $request, Response $response)
    {
        $user = $this->container->get('security.context')->getToken();
        $token = new UsernamePasswordToken($user, null, 'main',
                $user->getRoles());
        $this->rememberMeService->logout($request, $response, $token);
    }
}
