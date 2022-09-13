//
//  AccountViewController.swift
//  elber
//
//  Created by Martin Nava on 05/09/22.
//

import UIKit
import FirebaseAuth

class AccountViewController: UIViewController {

    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var emailLabel: UILabel!
    
    @IBOutlet weak var codeSwitch: UISwitch!
    @IBOutlet weak var biometricSwitch: UISwitch!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
        getUserData()
        setPrivacyView()
    }
    
    @IBAction func logOut(_ sender: Any) {
        do {
            try Auth.auth().signOut()
            performSegue(withIdentifier: "userLogOut", sender: nil)
        } catch let signOutError as NSError {
            AlertsUtil.showNotification(title: "Error", message: signOutError.localizedDescription, viewController: self)
        }
    }
    
    private func getUserData() {
        // guard let user = Auth.auth().currentUser
        guard let user = Auth.auth().currentUser else { return }
        
        if let displayName = user.displayName {
            nameLabel.text = displayName
        }
        
        if let email = user.email {
            emailLabel.text = email
        }
    }
    
    private func setPrivacyView() {
        let isCodeOn = AppUtils.getPrivacyStatus(identifier: Constants.UserDefaults.privacyCode)
        let isBiometricOn = AppUtils.getPrivacyStatus(identifier: Constants.UserDefaults.privacyBiometric)
        
        self.codeSwitch.isOn = isCodeOn
        self.biometricSwitch.isOn = isBiometricOn
        self.biometricSwitch.isEnabled = isCodeOn
    }
    
    @IBAction func codeSwitchChange(_ sender: UISwitch) {
        AppUtils.setPrivacyStatus(identifier: Constants.UserDefaults.privacyCode, status: sender.isOn)
        
        self.setPrivacyView()
    }
    
    @IBAction func biometricSwitchChange(_ sender: UISwitch) {
        AppUtils.setPrivacyStatus(identifier: Constants.UserDefaults.privacyBiometric, status: sender.isOn)
        
        self.setPrivacyView()
    }
}
