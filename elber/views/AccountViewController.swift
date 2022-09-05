//
//  AccountViewController.swift
//  elber
//
//  Created by Martin Nava on 05/09/22.
//

import UIKit
import FirebaseAuth

class AccountViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }
    
    @IBAction func logOut(_ sender: Any) {
        do {
            try Auth.auth().signOut()
            performSegue(withIdentifier: "userLogOut", sender: nil)
        } catch let signOutError as NSError {
            AlertsUtil.showNotification(title: "Error", message: signOutError.localizedDescription, viewController: self)
        }
    }
}
