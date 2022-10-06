//
//  AppViewController.swift
//  elber
//
//  Created by Martin Nava on 21/09/22.
//

import UIKit

class AppViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        AppController.isUserLogged { result, error in
            if(result) {
                let isCodeOn = AppUtils.getPrivacyStatus(identifier: Constants.UserDefaults.privacyCode)
                
                if(isCodeOn) {
                    self.performSegue(withIdentifier: "showCode", sender: nil)
                } else {
                    self.performSegue(withIdentifier: "showApp", sender: nil)
                }
            } else {
                self.performSegue(withIdentifier: "showLogin", sender: nil)
            }
        }
    }
}
