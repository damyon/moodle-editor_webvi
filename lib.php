<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * webvi moodle text editor
 *
 * @package    editor_webvi
 * @copyright  2014 Damyon Wiese
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class webvi_texteditor extends texteditor {

    /**
     * Is the current browser supported by this editor?
     *
     * Of course!
     * @return bool
     */
    public function supported_by_browser() {
        return true;
    }

    /**
     * Returns array of supported text formats.
     * @return array
     */
    public function get_supported_formats() {
        return array(FORMAT_PLAIN => FORMAT_PLAIN,
                     FORMAT_MOODLE => FORMAT_MOODLE,
                     FORMAT_HTML => FORMAT_HTML,
                     FORMAT_MARKDOWN => FORMAT_MARKDOWN);
    }

    /**
     * Returns text format preferred by this editor.
     * @return int
     */
    public function get_preferred_format() {
        return FORMAT_MARKDOWN;
    }

    /**
     * Does this editor support picking from repositories?
     * @return bool
     */
    public function supports_repositories() {
        //Not yet
        return false;
    }

    /**
     * Sets up head code if necessary.
     */
    public function head_setup() {
        // Not required.
    }

    /**
     * Use this editor for given element.
     *
     * @param string $elementid
     * @param array $options
     * @param null $fpoptions
     */
    public function use_editor($elementid, array $options=null, $fpoptions=null) {
        global $PAGE, $CFG;

        $PAGE->requires->yui_module('moodle-editor_webvi-editor',
                                    'M.editor_webvi.init',
                                    array($elementid));

    }

}
