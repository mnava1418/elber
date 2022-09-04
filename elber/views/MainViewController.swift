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
        print("ola k ace")
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
            }
        }
    }
    
    @IBAction func facebookSignIn(_ sender: Any) {
        print("amonos de aqui")
        let firebaseAuth = Auth.auth()
        do {
            try firebaseAuth.signOut()
            print("nos fuimos")
        } catch let signOutError as NSError {
            print("Error signing out: %@", signOutError)
        }
    }
    
    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
