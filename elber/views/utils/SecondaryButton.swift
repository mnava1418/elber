//
//  SecondaryButton.swift
//  elber
//
//  Created by Martin Nava on 29/08/22.
//

import UIKit

class SecondaryButton: UIButton {

    override func layoutSubviews() {
        super.layoutSubviews()
        self.layer.borderWidth = 4
        self.layer.borderColor = UIColor(named: "Primary")?.cgColor
        self.layer.backgroundColor = UIColor(named: "AccentColor")?.cgColor
        self.layer.cornerRadius = self.frame.height / 2
    }
}
