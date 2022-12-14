//
//  CodeViewController.swift
//  elber
//
//  Created by Martin Nava on 21/09/22.
//

import UIKit
import AudioToolbox

class CodeViewController: UIViewController {

    @IBOutlet weak var codeOne: UIImageView!
    @IBOutlet weak var codeTwo: UIImageView!
    @IBOutlet weak var codeThree: UIImageView!
    @IBOutlet weak var codeFour: UIImageView!
    @IBOutlet weak var codeFive: UIImageView!
    
    @IBOutlet weak var txtTitle: UILabel!
    
    var codeIndicators: [UIImageView] = []
    var inputCode: String = ""
    var tempCode: String = ""
    var currentAction = Constants.UseCodeActions.requestCode
    
    var callback: (() -> Void)?
        
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
        codeIndicators.append(codeOne)
        codeIndicators.append(codeTwo)
        codeIndicators.append(codeThree)
        codeIndicators.append(codeFour)
        codeIndicators.append(codeFive)
        
        self.setTitle()
    }
        
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if let disappearCallBack = callback {
            disappearCallBack()
        }
    }
    
    @IBAction func pressNumber(_ sender: UIButton) {
        inputCode += sender.tag.description
        
        if(inputCode.count <= 5) {
            activateIndicator(index: inputCode.count - 1)
        }
        
        if(inputCode.count == 5) {
            performAction()
        }
    }
    
    private func activateIndicator (index: Int) {
        if(index<=5) {
            codeIndicators[index].image = UIImage(systemName: "circle.fill")
        }
    }
    
    private func performAction() {
        if currentAction == Constants.UseCodeActions.newCode {
            newCodeAction()
        } else if currentAction == Constants.UseCodeActions.confirmCode {
            confirmCodeAction()
        } else {
            validateCode()
        }
        
        resetView()
    }
    
    private func resetView () {
        for element in codeIndicators {
            element.image = UIImage(systemName: "circle")
        }
        
        setTitle()
    }
    
    private func newCodeAction() {
        currentAction = Constants.UseCodeActions.confirmCode
        tempCode = inputCode
        inputCode = ""
    }
    
    private func confirmCodeAction() {
        if tempCode == inputCode {
            currentAction = Constants.UseCodeActions.requestCode
            AppUtils.setPrivacyStatus(identifier: Constants.UserDefaults.privacyCode, status: true)
            AppUtils.setUserCode(userCode: inputCode)
            self.dismiss(animated: true)
        } else {
            currentAction = Constants.UseCodeActions.newCode
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            
            for element in codeIndicators {
                element.shake()
            }
        }
        
        tempCode = ""
        inputCode = ""
    }
    
    private func validateCode() {
        let currentCode = AppUtils.getUserCode()
        
        if inputCode == currentCode {
            if currentAction == Constants.UseCodeActions.deactivateCode {
                AppUtils.setPrivacyStatus(identifier: Constants.UserDefaults.privacyCode, status: false)
                self.dismiss(animated: true)
            } else if currentAction == Constants.UseCodeActions.requestCode {
                self.performSegue(withIdentifier: "validCode", sender: nil)
            }
        } else {
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            
            for element in codeIndicators {
                element.shake()
            }
        }
        
        tempCode = ""
        inputCode = ""
    }
    
    private func setTitle() {
        switch currentAction {
        case Constants.UseCodeActions.newCode:
            txtTitle.text = "C??digo nuevo"
        case Constants.UseCodeActions.confirmCode:
            txtTitle.text = "Confirma tu c??digo"
        default:
            txtTitle.text = "Introduce tu c??digo"
        }
    }
}

//MARK: Extensions
extension UIView {
    func shake() {
        let anim = CABasicAnimation(keyPath: "position")
        anim.duration = 0.07
        anim.autoreverses = true
        anim.fromValue = NSValue(cgPoint: CGPoint(x: self.center.x - 10, y: self.center.y))
        anim.toValue = NSValue(cgPoint: CGPoint(x: self.center.x + 10, y: self.center.y))
        self.layer.add(anim, forKey: "position")
    }
}
