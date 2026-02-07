import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTour } from './Tour';
import './Navbar.css';

export default function Navbar() {
    const { startTour } = useTour();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1 className="navbar-title">C-Viz Internals</h1>
                <div className="navbar-subtitle">AST Visualizer & Static Analyzer</div>
            </div>

            <div className="navbar-actions">
                <button className="nav-tour-btn" onClick={startTour} title="Start guided tour">
                    <HelpCircle size={18} />
                    <span>Tour</span>
                </button>
            </div>
        </nav>
    );
}
