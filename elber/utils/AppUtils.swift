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
    
    static func setPrivacyStatus(identifier: String, status: Bool) {
        UserDefaults.standard.set(status, forKey: identifier)
    }
    
    static func setUserCode(userCode: String) {
        UserDefaults.standard.set(userCode, forKey: Constants.UserDefaults.privacyUserCode)
    }
    
    static func getUserCode() -> String {
        if let userCode = UserDefaults.standard.value(forKey: Constants.UserDefaults.privacyUserCode) {
            return userCode as! String
        } else {
            return ""
        }
    }
}
