//
//  AppUtils.swift
//  elber
//
//  Created by Martin Nava on 12/09/22.
//

import Foundation

struct AppUtils {
    
    static func getPrivacyStatus(identifier: String) -> Bool {
        if let result = UserDefaults.standard.value(forKey: identifier) {
            return result as! Bool
        } else {
            return false
        }
    }
    
    static func setPrivacyStatus(identifier: String, status: Bool ) {
        UserDefaults.standard.set(status, forKey: identifier)
    }
}
