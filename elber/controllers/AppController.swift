//
//  AppController.swift
//  elber
//
//  Created by Martin Nava on 19/09/22.
//

import Foundation
import UIKit
import FirebaseAuth

struct AppController {
    private let storyBoard:UIStoryboard
    private let sceneDelegate:SceneDelegate
    
    init(storyBoardName: String) {
        self.storyBoard = UIStoryboard(name: storyBoardName, bundle: nil)
        self.sceneDelegate = UIApplication.shared.connectedScenes.first?.delegate as! SceneDelegate
    }
    
    public func appResignActive() {
        let launchViewController = self.storyBoard.instantiateViewController(identifier: Constants.StoryBoardNames.launchScreen)
        
        self.sceneDelegate.window?.rootViewController = launchViewController
    }
    
    public func appBecomeActive() {
        let appViewController = self.storyBoard.instantiateViewController(identifier: Constants.StoryBoardNames.main) as! AppViewController
        
        self.sceneDelegate.window?.rootViewController = appViewController
    }
    
    static func isUserLogged(completionHandler: @escaping(_ result: Bool, _ error: String?) -> Void) {
        guard let user = Auth.auth().currentUser else {
            completionHandler(false, nil)
            return
        }
        
        user.reload { error in
            
            if let currError = error {
                completionHandler(false, currError.localizedDescription)
            }
            else {
                completionHandler(true, nil)
            }
        }
    }
}
