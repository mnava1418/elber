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

class MainViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
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
        AlertsUtil.showNotification(title: "Facebook", message: "", viewController: self)
    }
}
