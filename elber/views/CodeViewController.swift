//
//  CodeViewController.swift
//  elber
//
//  Created by Martin Nava on 21/09/22.
//

import UIKit

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
    
    private func setTitle() {
        switch currentAction {
        case Constants.UseCodeActions.newCode:
            txtTitle.text = "Código nuevo"
        case Constants.UseCodeActions.confirmCode:
            txtTitle.text = "Confirma tu código"
        default:
            txtTitle.text = "Introduce tu código"
        }
    }
}
