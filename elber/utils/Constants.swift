//
//  Constants.swift
//  elber
//
//  Created by Martin Nava on 12/09/22.
//

import Foundation

struct Constants {
    struct UserDefaults {
        static let privacyCode = "privacy.code"
        static let privacyBiometric = "privacy.biometric"
    }
    
    struct StoryBoardNames {
        static let launchScreen = "LaunchScreen"
        static let main = "Main"
    }
    
    struct UseCodeActions {
        static let newCode = 1
        static let confirmCode = 2
        static let requestCode = 3
    }
}
