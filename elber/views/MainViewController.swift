//
//  MainViewController.swift
//  elber
//
//  Created by Martin Nava on 29/08/22.
//

import UIKit
import FirebaseCore
import GoogleSignIn
import FirebaseAuth
import FBSDKLoginKit

class MainViewController: UIViewController {

    var userStateChangeHandler: AuthStateDidChangeListenerHandle?
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        isUserLogged()
    }
    
    private func isUserLogged() {
        guard let user = Auth.auth().currentUser else { return }
        
        user.reload { error in
            
            if let currError = error {
                AlertsUtil.showNotification(title: "Error", message: currError.localizedDescription, viewController: self)
            }
            else {
                self.performSegue(withIdentifier: "userLogged", sender: nil)
            }
        }
    }
    
    @IBAction func googleSignIn(_ sender: Any) {
        guard let clientID = FirebaseApp.app()?.options.clientID else { return }
        
        let config = GIDConfiguration(clientID: clientID)
        
        GIDSignIn.sharedInstance.signIn(with: config, presenting: self) {user, error in
            
            if let currError = error {
                AlertsUtil.showNotification(title: "Error", message: currError.localizedDescription, viewController: self)
                return
            }
            
            guard
                let authentication = user?.authentication,
                let idToken = authentication.idToken
            else {
                return
            }
            
            let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: authentication.accessToken)
            
            Auth.auth().signIn(with: credential) { result, error in
                if let currError = error {
                    AlertsUtil.showNotification(title: "Error", message: currError.localizedDescription, viewController: self)
                    return
                }
                
                self.performSegue(withIdentifier: "userLogged", sender: nil)
            }
        }
    }
    
    @IBAction func facebookSignIn(_ sender: Any) {
        let loginManager = LoginManager()
        loginManager.logIn(permissions: ["public_profile"], from: self) { result, error in
            if let error = error {
                AlertsUtil.showNotification(title: "Error", message: error.localizedDescription, viewController: self)
            } else if let result = result, result.isCancelled {
                AlertsUtil.showNotification(title: "Error", message: "The user canceled the sign-in flow.", viewController: self)
            } else {
                let credential = FacebookAuthProvider.credential(withAccessToken: AccessToken.current!.tokenString)
                
                Auth.auth().signIn(with: credential) { result, error in
                    if let currError = error {
                        AlertsUtil.showNotification(title: "Error", message: currError.localizedDescription, viewController: self)
                        return
                    }
                    
                    self.performSegue(withIdentifier: "userLogged", sender: nil)
                }
            }
        }
    }
}
