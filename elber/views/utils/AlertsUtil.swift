//
//  AlertsUtil.swift
//  elber
//
//  Created by Martin Nava on 04/09/22.
//

import Foundation
import UIKit

struct AlertsUtil {
    static func showNotification(title: String, message: String, viewController: UIViewController) {
        let alertScreen = UIAlertController(title: title, message: message, preferredStyle: .alert)
        let okAction = UIAlertAction(title: "Ok", style: .default)
        
        alertScreen.addAction(okAction)
        viewController.present(alertScreen, animated: true)
    }
}
