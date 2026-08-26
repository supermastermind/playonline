#!/bin/bash

############################
#
# Bash script to verify the safety and health of an Ubuntu installation.
# It detects potential issues and displays warning/error messages, similar to an antivirus scan.
# Running it regularly helps ensure that no critical components have changed or been corrupted.
# Customize it to fit your specific Linux installation.
# (https://github.com/simplelinuxscripts/ubuntucheckup)
#
############################

export LC_ALL=en_US.UTF-8

############
# Parameters
############

# Adapt those parameter values as needed depending on your Ubuntu installation

STOP_ON_WARNINGS=0
STOP_ON_ERRORS=0
TEST_SUDO_PWD=1

# Guidelines to fill HARD_DISK_DEVICE parameter:
# - Example #1: output of lsblk command is:
#   NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
#   loop0    7:0    0     4K  1 loop /snap/bare/5
#   loop1    7:1    0 182.8M  1 loop /snap/chromium/3169
#   ...
#   sda      8:0    0 232.9G  0 disk 
#   |-sda1   8:1    0     1G  0 part /boot/efi
#   `-sda2   8:2    0 231.8G  0 part /var/snap/firefox/common/host-hunspell
#                                    /
#   => disk device for root folder is sda
#   => HARD_DISK_DEVICE shall be set to "/dev/sda"
# Example #2: output of lsblk command is:
#   NAME                        MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
#   loop0                         7:0    0  74.2M  1 loop  /snap/core22/1380
#   loop1                         7:1    0     4K  1 loop  /snap/bare/5
#   ...
#   loop16                        7:16   0  10.7M  1 loop  /snap/snap-store/1218
#   nvme0n1                     259:0    0 476.9G  0 disk
#   ├─nvme0n1p1                 259:1    0     1G  0 part  /boot/efi
#   ├─nvme0n1p2                 259:2    0     2G  0 part  /boot
#   └─nvme0n1p3                 259:3    0 473.9G  0 part
#     └─dm_crypt-0              252:0    0 473.9G  0 crypt
#       └─ubuntu--vg-ubuntu--lv 252:1    0 473.9G  0 lvm    /
#   => disk device for root folder is nvme0n1
#   => HARD_DISK_DEVICE shall be set to "/dev/nvme0n1"
HARD_DISK_DEVICE="/dev/xxx"

# Firefox snap settings folder
SNAP_FOLDER="${HOME}/snap"
SNAP_FIREFOX_FOLDER="${SNAP_FOLDER}/firefox/common/.mozilla/firefox"
SNAP_FIREFOX_PROFILE_FOLDER="${SNAP_FIREFOX_FOLDER}/xxxxxxxx.default"

# Chromimum snap settings folder
SNAP_CHROMIUM_FOLDER="${SNAP_FOLDER}/chromium/common/chromium/Default"

# Expected PATH environment variable value (any change of PATH environment variable will be detected)
EXPECTED_PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"

# Expected program(s) in /usr/local/bin if any, "" if none
EXPECTED_USR_LOCAL_BIN_PROGRAMS=""

# Optional: folder used to save a copy of some important configuration files
#           and therefore be able to regularly check that they were not modified
SCRIPT_FOLDER=$(dirname "$0")
CHECKUP_FOLDER="${SCRIPT_FOLDER}/checkup_files"

# Extended checks (can be long)
EXTENDED_CHECKS=0

########
# Script
########

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    success_str="$1"
    echo -e "${GREEN}CHECKED${NC} ${success_str}"
}

print_info() {
    info_str="$1"
    echo "Info: ${info_str}"
}

nb_warnings=0
print_warning() {
    warning_str="$1"
    stop_on_warning="$2"
    nb_warnings=$((nb_warnings+1))
    echo -e "${YELLOW}Warning:${NC} ${warning_str}"
    if [ "${STOP_ON_WARNINGS}" == "1" ] || [ "${stop_on_warning}" == "1" ]; then
        read -p "Press Enter to ignore..."
    fi
}

nb_errors=0
print_error() {
    error_str="$1"
    stop_on_error="$2"
    nb_errors=$((nb_errors+1))
    echo -e "${RED}ERROR:${NC} ${error_str}"
    if [ "${STOP_ON_ERRORS}" == "1" ] || [ "${stop_on_error}" == "1" ]; then
        read -p "Press Enter to ignore..."
    fi
}

if ! [ -d "${CHECKUP_FOLDER}" ]; then
    echo
    print_warning "checkup folder ${CHECKUP_FOLDER} does not exist."
    echo "Create it to fully benefit from the potential of this script."
    echo "This folder contains files and command results. They shall be saved manually by the user, as defined in this script."
    echo "They will then be checked for changes at each script execution, ensuring nothing critical has changed in the safety"
    echo "and health of the Ubuntu installation."
fi

echo
echo "---------- Account check ----------"
echo

# Check that password is requested for sudo commands
if [ ${TEST_SUDO_PWD} -eq 1 ]; then
    sudo -k
    sudo -n true 2> /dev/null
    if [ $? -eq 0 ]; then
        print_error "sudo without password"
    else
        print_success "sudo password"
    fi
else
    print_warning "sudo password check is skipped"
fi

# Check sudoers
if [ -d "${CHECKUP_FOLDER}/etc/sudoers.d" ]; then
    error_found=0
    # Notes:
    # - ${CHECKUP_FOLDER}/etc/sudoers shall be created with current user's ownership (not root like source file) so that the script can access it, for example with:
    #     sudo cp /etc/sudoers ${CHECKUP_FOLDER}/etc/sudoers
    #     followed by sudo chown yourusername:yourgroupname ${CHECKUP_FOLDER}/etc/sudoers
    #   The same applies to other files/folders checked in ${CHECKUP_FOLDER} by this script.
    # - The command to edit /etc/sudoers file would be visudo
    sudo diff -w "${CHECKUP_FOLDER}/etc/sudoers" "/etc/sudoers"
    if [ $? -ne 0 ]; then
        print_error "sudoers have changed in /etc/sudoers (check changes and copy file /etc/sudoers to ${CHECKUP_FOLDER}/etc/sudoers)"
        error_found=1
    fi
    sudo diff -rU 0 --exclude="*.save" "${CHECKUP_FOLDER}/etc/sudoers.d" "/etc/sudoers.d"
    if [ $? -ne 0 ]; then
        print_error "sudoers have changed in /etc/sudoers.d (check changes and copy folder /etc/sudoers.d to ${CHECKUP_FOLDER}/etc/sudoers.d)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "sudoers"
    fi
else
    print_warning "sudoers check is skipped because reference folder ${CHECKUP_FOLDER}/etc/sudoers.d does not exist"
fi

echo
echo "---------- Session check ----------"
echo

# Check that ubuntu wayland session is available (safer than X11 and Xorg)
ubuntu_wayland_sessions=$(ls /usr/share/wayland-sessions/ | grep -E "ubuntu.*\.desktop") # example of ls /usr/share/wayland-sessions/ output: plasma.desktop  ubuntu-wayland.desktop  ubuntu.desktop
if [ -z "${ubuntu_wayland_sessions}" ]; then
    print_error "no ubuntu wayland session is available"
# Check that current session type is wayland (safer than X11 and Xorg)
elif ! [ "$XDG_SESSION_TYPE" == "wayland" ]; then
    print_error "wayland session type was not selected in login screen ($XDG_SESSION_TYPE)"
else
    print_success "wayland session"
fi

# Check if sessions were opened by other users
# (gdm stands for GNOME Display Manager)
sessions_opened_by_other_users=$(journalctl -u systemd-logind --no-pager | grep -i "New session" | grep -v "$(whoami)." | grep -v "user gdm." | grep -v "user 'gdm'" | grep -v "user sddm." | grep -v "user 'sddm'")
if [ -n "$sessions_opened_by_other_users" ]; then
    echo "$sessions_opened_by_other_users"
    print_warning "sessions were opened by above other user(s)"
else
    print_success "opened sessions"
fi

echo
echo "---------- Network check ----------"
echo

# Check network connection availability
ping -c 1 -W 5 "www.google.com" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "network connection"
else
    print_error "no network connection detected (next commands may fail)" 1
fi

# Check wireless connections (wifi, bluetooth)
wireless_sw_status=$(rfkill list)
if ! $(echo "${wireless_sw_status}" | grep -q "Soft blocked: no"); then
    print_success "wireless connections"
else
    echo "${wireless_sw_status}"
    print_warning "wireless connection(s) enabled"
fi

# Check firewall
echo "checking firewall..."
ufw_status=$(sudo ufw status verbose)
ufw_status_1=$(echo "${ufw_status}" | grep -o "Status: active")
if [ "$ufw_status_1" == "Status: active" ]; then
    print_success "ufw enabled"

    ufw_status_2=$(echo "${ufw_status}" | grep -o "deny (incoming)")
    if [ "$ufw_status_2" == "deny (incoming)" ]; then
        print_success "ufw incoming traffic denied"
    else
        print_error "ufw incoming traffic is not denied"
    fi

    ufw_status_3=$(echo "${ufw_status}" | grep -o "allow (outgoing)")
    if [ "$ufw_status_3" == "allow (outgoing)" ]; then
        print_success "ufw outgoing traffic allowed"
    else
        print_error "ufw outgoing traffic is not allowed"
    fi

    ufw_status_4=$(echo "${ufw_status}" | grep -o "disabled (routed)")
    if [ "$ufw_status_4" == "disabled (routed)" ]; then
        print_success "ufw routed traffic disabled"
    else
        print_error "ufw routed traffic is not disabled"
    fi

    ufw_status_5=$(echo "${ufw_status}" |  grep -o "Logging: on (low)")
    if [ "$ufw_status_5" == "Logging: on (low)" ]; then
        print_success "ufw logging"
    else
        print_warning "ufw logging is not on+low"
    fi
else
    print_error "ufw disabled ('sudo ufw enable' to be run)"
fi

echo
echo "---------- Disk check ----------"
echo

# Check disk usage
usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$usage" -ge 60 ]; then
    print_warning "disk usage is high: $usage%"
else
    print_success "disk usage ($usage%)"
fi

# Check size of specific folders
if [ -d "${HOME}/.cache" ]; then # Note: this is one cache folder among others
    cache_size=$(du -sb "${HOME}/.cache" | cut -f1)
    if [ "$cache_size" -gt "$((2 * 1024 * 1024 * 1024))" ]; then # 2Gb
        print_warning "cache contents in folder ${HOME}/.cache take a lot of space: $((cache_size / 1024 / 1024)) MB (close all apps, run 'rm -rf ${HOME}/.cache/*' and restart Linux)"
    fi
fi

disk_size=$(lsblk -d -o SIZE "${HARD_DISK_DEVICE}" | tail -1)
if [[ "$disk_size" != *G && "$disk_size" != *T ]]; then # G for giga, T for Tera are valid disk sizes
    print_error "disk size error (have you set HARD_DISK_DEVICE script parameter correctly?) $disk_size"
fi
disk_status=$(sudo smartctl -a "${HARD_DISK_DEVICE}")
if ! $(echo "${disk_status}" | grep -q "SMART overall-health self-assessment test result: PASSED"); then
    print_error "disk errors detected (test result)"
elif ! $(echo "${disk_status}" | grep -q "No Errors Logged"); then
    print_error "disk errors detected (errors logged)"
elif $(echo "${disk_status}" | grep -q -E "Critical Warning.*[1-9][0-9]*$"); then
    print_error "disk errors detected (critical warnings)"
elif $(echo "${disk_status}" | grep -q -E "Media and Data Integrity Errors.*[1-9][0-9]*$"); then
    print_error "disk errors detected (media and data integrity)"
else
    filtered_disk_status=$(echo "${disk_status}" | grep -E 'FAIL|ERROR|error|Reallocated_Sector_Ct.*[1-9][0-9]*$|Used_Rsvd_Blk_Cnt_Tot.*[1-9][0-9]*$|Program_Fail_Cnt_Total.*[1-9][0-9]*$|Erase_Fail_Count_Total.*[1-9][0-9]*$|Runtime_Bad_Block.*[1-9][0-9]*$|Uncorrectable_Error_Cnt.*[1-9][0-9]*$|ECC_Error_Rate.*[1-9][0-9]*$|CRC_Error_Count.*[1-9][0-9]*$|Current_Pending_Sector|Offline_Uncorrectable|Unable' | grep -v "Media and Data Integrity Errors:    0" | grep -v "Error Information" | grep -v "No Errors Logged" | grep -v "without error" | grep -v "WHEN_FAILED" | grep -v "LBA_of_first_error" | grep -v "Error Recovery Control supported" | grep -v "Error logging supported")
    if [ -n "${filtered_disk_status}" ]; then
        echo "${filtered_disk_status}"
        filtered_errors=$(echo "${filtered_disk_status}" | grep -v -i "warning")
        if [ -n "${filtered_errors}" ]; then
            print_error "disk errors detected, see above"
        else
            print_warning "disk warnings detected, see above"
        fi
    else
        print_success "disk health"
    fi
fi

# Check disk encryption
if ! $(lsblk -o NAME,KNAME,FSTYPE,TYPE,MOUNTPOINT,SIZE | grep -q "crypt"); then
    print_info "no disk is encrypted"
fi

echo
echo "---------- Runtime check ----------"
echo

# Collect errors from journalctl (journalctl priorities: "emerg" (0), "alert" (1), "crit" (2), "err" (3), "warning" (4), "notice" (5), "info" (6), "debug" (7))
journalctl -p 0..2 --since "14 days ago" > /tmp/journalctl_errors.log
error_summary=$(grep -oP '(?<=: ).*' /tmp/journalctl_errors.log | sed 's/for [0-9]*s/for XXs/g' | grep -v "password is required" | sort | uniq -c | sort -nr  | head -25 | awk '{$1=$1; print}' | sed 's/^/- /')
if [ -n "$error_summary" ]; then
    print_info "most frequent critical errors:"
    printf '%s\n' "$error_summary"
else
    print_success "no critical error in journaltcl"
fi

# Detect basic suspicious processes
SUSPICIOUS_KEYWORDS='rootkit|snif|backd|stealth|keyl|logk|troj|virus|hack|malware|spy|\btap|tap\b|hide|hidden|cloak|transparent|lkl|uberkey|vlog|letterpress|sinister|tanit|keystroke|spy'
ps aux | grep -v "grep " | grep -Ei "$SUSPICIOUS_KEYWORDS|track|input|capture|scan|record|hook" && print_error "suspicious process(es) found"
# Note: if you install external tools like chkrootkit package, complex rootkit detections can be done

# Detect processes that are still executing after their executable files have been removed (suspicious processes)
find /proc/*/exe -lname '*(deleted)' 2>/dev/null | while read -r exe; do
    print_warning "suspicious process: deleted executable is still running: $exe"
done

# Detect zombie processes
# Zombie processes are those that have completed execution but still exist in the process table because their parent hasn't cleaned them up
zombie_processes=$(ps aux | awk '$8 ~ /^Z/ { print $0 }')
if [ -n "$zombie_processes" ]; then
    echo "$zombie_processes"
    print_warning "above zombie processes were detected"
fi

echo
echo "---------- Apparmor check ----------"
echo

error_found=0
apparmor_status=$(sudo systemctl status apparmor)
apparmor_loaded=$(echo "$apparmor_status" | grep "Loaded: loaded (/usr/lib/systemd/system/apparmor.service; enabled; preset: enabled)")
apparmor_active=$(echo "$apparmor_status" | grep "Active: active (exited)")
nb_apparmor_enforce_profiles=$(sudo aa-status | grep "profiles are in enforce mode" | grep -o '^[0-9]\+')
nb_apparmor_processes=$(sudo aa-status | grep "processes have profiles defined" | grep -o '^[0-9]\+')
nb_apparmor_enforce_processes=$(sudo aa-status | grep "processes are in enforce mode" | grep -o '^[0-9]\+')
nb_apparmor_prompt_processes=$(sudo aa-status | grep "processes are in prompt mode" | grep -o '^[0-9]\+')
nb_apparmor_unconfined_processes=$(sudo aa-status | grep "processes are unconfined" | grep -o '^[0-9]\+')
nb_apparmor_mixed_processes=$(sudo aa-status | grep "processes are in mixed mode" | grep -o '^[0-9]\+')
# Check that apparmor is on
if [ -z "${apparmor_loaded}" ]; then
    print_error "apparmor not loaded and enabled"
    error_found=1
elif [ -z "${apparmor_active}" ]; then
    print_error "apparmor not active"
    error_found=1
# Check total number of apparmor [enforce] profiles and processes
elif [ "${nb_apparmor_enforce_profiles}" == "" ] || [ ${nb_apparmor_enforce_profiles} -lt 50 ]; then # (adapt threshold value in this condition as needed)
    print_error "too few apparmor profiles in enforce mode (${nb_apparmor_enforce_profiles})"
    error_found=1
elif [ "${nb_apparmor_processes}" == "" ] || [ ${nb_apparmor_processes} -lt 5 ]; then # (adapt threshold value in this condition as needed)
    print_error "too few apparmor processes (${nb_apparmor_processes})"
    error_found=1
elif [ "${nb_apparmor_enforce_processes}" == "" ] || [ ${nb_apparmor_enforce_processes} -eq 0 ]; then
    print_error "no apparmor processes in enforce mode"
    error_found=1
else
    enforce_ratio=$((100 * nb_apparmor_enforce_processes / nb_apparmor_processes))
    if [ ${enforce_ratio} -lt 80 ]; then # (adapt threshold value in this condition as needed)
        print_error "too few apparmor processes in enforce mode (${nb_apparmor_enforce_processes} out of ${nb_apparmor_processes}: ${enforce_ratio}%)"
        error_found=1
    fi
fi
# Check apparmor namespace creation restrictions
apparmor_restrict_unprivileged_userns=$(sysctl kernel.apparmor_restrict_unprivileged_userns)
if ! [ "$apparmor_restrict_unprivileged_userns" == "kernel.apparmor_restrict_unprivileged_userns = 1" ]; then
    print_error "unprivileged users can create user namespaces"
    error_found=1
fi
# Check unsafe apparmor processes 1/2
if [ "${nb_apparmor_prompt_processes}" == "" ] || [ ${nb_apparmor_prompt_processes} -ne 0 ]; then
  print_warning "apparmor processes in prompt mode (${nb_apparmor_prompt_processes})"
fi
if [ "${nb_apparmor_unconfined_processes}" == "" ] || [ ${nb_apparmor_unconfined_processes} -ne 0 ]; then
  print_warning "apparmor processes in unconfined mode (${nb_apparmor_unconfined_processes})"
fi
if [ "${nb_apparmor_mixed_processes}" == "" ] || [ ${nb_apparmor_mixed_processes} -ne 0 ]; then
  print_warning "apparmor processes in mixed mode (${nb_apparmor_mixed_processes})"
fi
# Check unsafe apparmor processes 2/2: complain mode
if [ -f "${CHECKUP_FOLDER}/apparmor_complain_processes_sauv.txt" ]; then
    nb_processes_in_complain_mode_sauv=$(more "${CHECKUP_FOLDER}/apparmor_complain_processes_sauv.txt" | grep "in complain mode" | awk '{print $1}')
    sudo aa-status | sed -n '/processes are in complain mode/,/processes are/p' | sed 's/([0-9]\+)/X/g' | sed '$d' > "${CHECKUP_FOLDER}/apparmor_complain_processes_current.txt"
    nb_processes_in_complain_mode_current=$(more "${CHECKUP_FOLDER}/apparmor_complain_processes_current.txt" | grep "in complain mode" | awk '{print $1}')
    if [[ "$nb_processes_in_complain_mode_sauv" =~ ^[0-9]+$ && "$nb_processes_in_complain_mode_current" =~ ^[0-9]+$ ]]; then
        if [ $nb_processes_in_complain_mode_sauv -lt $((nb_processes_in_complain_mode_current - 3)) ]; then
            diff "${CHECKUP_FOLDER}/apparmor_complain_processes_sauv.txt" "${CHECKUP_FOLDER}/apparmor_complain_processes_current.txt"
            if [ $? -ne 0 ]; then
                print_warning "apparmor processes in complain mode have changed (check changes and copy file ${CHECKUP_FOLDER}/apparmor_complain_processes_current.txt to ${CHECKUP_FOLDER}/apparmor_complain_processes_sauv.txt)"
            fi
        fi
    else
        print_warning "apparmor processes in complain mode check is skipped because numbers of processes cannot be extracted: $nb_processes_in_complain_mode_sauv, $nb_processes_in_complain_mode_current"
    fi
else
    print_warning "apparmor processes in complain mode check is skipped because reference file ${CHECKUP_FOLDER}/apparmor_complain_processes_sauv.txt does not exist"
fi

if [ ${error_found} -eq 0 ]; then
    print_success "apparmor"
fi

echo
echo "---------- Install check ----------"
echo

# Check repository list
error_found=0
unexpected_repo_urls=$(apt-cache policy | grep -oE '\bhttp[^ ]+' | grep -v 'http://security.ubuntu.com/ubuntu' | grep -v 'http://archive.ubuntu.com/ubuntu')
if [ -n "${unexpected_repo_urls}" ]; then
    echo "${unexpected_repo_urls}"
    print_error "above repository URLs are unexpected"
    error_found=1
fi
if [ -d "${CHECKUP_FOLDER}/etc/apt/sources.list.d" ]; then
    diff "${CHECKUP_FOLDER}/etc/apt/sources.list" "/etc/apt/sources.list"
    if [ $? -ne 0 ]; then
        print_error "repository list has changed in /etc/apt/sources.list (check changes and copy file /etc/apt/sources.list to ${CHECKUP_FOLDER}/etc/apt/sources.list)"
        error_found=1
    fi

    diff -rU 0 --exclude="*.save" "${CHECKUP_FOLDER}/etc/apt/sources.list.d" "/etc/apt/sources.list.d"
    if [ $? -ne 0 ]; then
        print_error "repository list has changed in /etc/apt/sources.list.d (check changes and copy folder /etc/apt/sources.list.d to ${CHECKUP_FOLDER}/etc/apt/sources.list.d)"
        error_found=1
    fi

    apt-cache policy > "${CHECKUP_FOLDER}/apt-cache_policy_current.txt"
    diff "${CHECKUP_FOLDER}/apt-cache_policy_sauv.txt" "${CHECKUP_FOLDER}/apt-cache_policy_current.txt"
    if [ $? -ne 0 ]; then
        print_error "repository list has changed for apt-cache policy (check changes and copy file ${CHECKUP_FOLDER}/apt-cache_policy_current.txt to ${CHECKUP_FOLDER}/apt-cache_policy_sauv.txt)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "repository list"
    fi
else
    print_warning "repository list check is skipped because reference folder ${CHECKUP_FOLDER}/etc/apt/sources.list.d does not exist"
fi

# Check software updates
customized_file_1="/etc/apt/apt.conf.d/10periodic" # file customized via Software & Updates / Updates tab
customized_file_2="/etc/apt/apt.conf.d/20auto-upgrades" # file customized via Software & Updates / Updates tab
customized_file_3="/etc/apt/apt.conf.d/50unattended-upgrades" # file customized manually if needed (e.g. to make upgrades automatic)
software_update_rate=$(cat "${customized_file_1}" | grep -E "Update-Package-Lists.*\"1\";")
if [ -z "${software_update_rate}" ]; then
    print_error "software update rate is not daily (can be updated in 'Software & Updates / Updates tab')"
fi
download_upgradeable_packages_0=$(cat "${customized_file_1}" | grep -E "Download-Upgradeable-Packages.*\"0\";")
download_upgradeable_packages_1=$(cat "${customized_file_1}" | grep -E "Download-Upgradeable-Packages.*\"1\";")
if [ -z "${download_upgradeable_packages_0}" ] && [ -z "${download_upgradeable_packages_1}" ]; then
    print_warning "cannot check download upgradeable packages"
fi
unattended_upgrade=$(cat "${customized_file_1}" | grep -E "Unattended-Upgrade.*\"0\";")
if [ -n "$download_upgradeable_packages_1" ] && [ -n "$unattended_upgrade" ]; then
    print_error "software update only downloads but does not install new packages (can be updated in 'Software & Updates / Updates tab')"
fi
if [ -d "${CHECKUP_FOLDER}/etc/apt/apt.conf.d" ]; then
    error_found=0
    diff "${CHECKUP_FOLDER}$customized_file_1" ${customized_file_1}
    if [ $? -ne 0 ]; then
        print_error "software update parameters have changed (check changes and copy file ${customized_file_1} to ${CHECKUP_FOLDER}$customized_file_1)"
        error_found=1
    fi
    diff "${CHECKUP_FOLDER}$customized_file_2" ${customized_file_2}
    if [ $? -ne 0 ]; then
        print_error "software auto-upgrades parameters have changed (check changes and copy file ${customized_file_2} to ${CHECKUP_FOLDER}$customized_file_2)"
        error_found=1
    fi
    diff "${CHECKUP_FOLDER}$customized_file_3" ${customized_file_3}
    if [ $? -ne 0 ]; then
        print_error "software unattended-upgrades parameters have changed (check changes and copy file ${customized_file_3} to ${CHECKUP_FOLDER}$customized_file_3)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "software update parameters"
    fi
else
    print_warning "software update parameters check is skipped because reference folder ${CHECKUP_FOLDER}/etc/apt/apt.conf.d does not exist"
fi

# Check startup applications and services
# system-wide autostart folder: /etc/xdg/autostart: not checked (contains for example update-notifier.desktop, snap-userd-autostart.desktop, org.kde.discover.notifier.desktop)
# user-specific autostart folder: ~/.config/autostart
if [ -d "${CHECKUP_FOLDER}/.config/autostart" ]; then
    error_found=0
    diff -rU 0 "${CHECKUP_FOLDER}/.config/autostart" "${HOME}/.config/autostart/"
    if [ $? -ne 0 ]; then
        print_error "startup applications have changed (check changes and copy file ${HOME}/.config/autostart/ to ${CHECKUP_FOLDER}/.config/autostart)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "startup applications"
    fi
else
    print_warning "startup applications check is skipped because reference folder ${CHECKUP_FOLDER}/.config/autostart does not exist"
fi
if [ -f "${CHECKUP_FOLDER}/systemctl_services_enabled_sauv.txt" ]; then
    error_found=0
    systemctl list-unit-files --type=service --state=enabled > "${CHECKUP_FOLDER}/systemctl_services_enabled_current.txt"
    diff -w "${CHECKUP_FOLDER}/systemctl_services_enabled_sauv.txt" "${CHECKUP_FOLDER}/systemctl_services_enabled_current.txt"
    if [ $? -ne 0 ]; then
        print_error "startup services have changed (check changes and copy file ${CHECKUP_FOLDER}/systemctl_services_enabled_current.txt to ${CHECKUP_FOLDER}/systemctl_services_enabled_sauv.txt)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "startup services"
    fi
else
    print_warning "startup services check is skipped because reference file ${CHECKUP_FOLDER}/systemctl_services_enabled_sauv.txt does not exist"
fi
# Check SysVinit (Ubuntu used SysVinit in older versions, but now uses systemd as the default init system. However, /etc/init.d/ still exists for backward compatibility and for services that haven’t migrated to systemd)
if [ -d "/etc/init.d" ]; then
    non_root_sysvinit_scripts=$(find "/etc/init.d" -type f ! -user root) # scripts not owned by root can pose a security risk
    if [ -n "${non_root_sysvinit_scripts}" ]; then
        print_error "unexpected non root SysVinit script(s):\n$non_root_sysvinit_scripts"
    fi
fi

# Check startup scripts
# When bash starts as a login shell (like when you log in via the console or an SSH session), it checks in order:
# - ~/.bash_profile
# - If that doesn’t exist, then ~/.bash_login
# - If that doesn’t exist either, then ~/.profile
# In Ubuntu, graphical terminals like GNOME terminal typically launch non-login interactive shells. In those cases:
# - Bash skips .bash_profile, .bash_login, and .profile.
# - Instead, it directly sources ~/.bashrc
if [ -f "${CHECKUP_FOLDER}/.profile" ] && [ -f "${CHECKUP_FOLDER}/.bashrc" ]; then # (grouped check because both files are present by default in Ubuntu)
    error_found=0

    if [ -f "${HOME}/.bash_profile" ]; then # (adapt this check if this file is legitimate)
        print_error "unexpected ${HOME}/.bash_profile file"
        error_found=1
    fi
    if [ -f "${HOME}/.bash_login" ]; then # (adapt this check if this file is legitimate - file rarely used today)
        print_error "unexpected ${HOME}/.bash_login file"
        error_found=1
    fi

    diff "${CHECKUP_FOLDER}/.profile" "${HOME}/.profile"
    if [ $? -ne 0 ]; then
        print_error ".profile file has changed (check changes and copy file ${HOME}/.profile to ${CHECKUP_FOLDER}/.profile)"
        error_found=1
    fi

    diff "${CHECKUP_FOLDER}/.bashrc" "${HOME}/.bashrc"
    if [ $? -ne 0 ]; then
        print_error ".bashrc file has changed (check changes and copy file ${HOME}/.bashrc to ${CHECKUP_FOLDER}/.bashrc)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "startup scripts"
    fi
else
    print_warning "startup scripts check is skipped because reference files ${CHECKUP_FOLDER}/.profile and ${CHECKUP_FOLDER}/.bashrc do not exist"
fi

# Jobs scheduled with cron (adapt this check if legitimate jobs are scheduled)
scheduled_cron_jobs=$(crontab -l 2>&1 | grep -v "no crontab for")
if [ -n "${scheduled_cron_jobs}" ]; then
    echo ${scheduled_cron_jobs}
    print_error "unexpected jobs are scheduled with cron"
fi
# Timers
# Note: those checks could be extended to anacron / other periodical mechanisms
if [ -f "${CHECKUP_FOLDER}/timers_sauv.txt" ]; then
    error_found=0
    systemctl list-timers --all | awk '{print $(NF-1), $NF}' 2> /dev/null > "${CHECKUP_FOLDER}/timers_current.txt"
    diff <(sort "${CHECKUP_FOLDER}/timers_sauv.txt") <(sort "${CHECKUP_FOLDER}/timers_current.txt")
    if [ $? -ne 0 ]; then
        print_error "timers have changed (check changes and copy file ${CHECKUP_FOLDER}/timers_current.txt to ${CHECKUP_FOLDER}/timers_sauv.txt)"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "timers"
    fi
else
    print_warning "timers check is skipped because reference file ${CHECKUP_FOLDER}/timers_sauv.txt does not exist"
fi

# Check files with special SUID or SGID permissions. SUID (Set User ID) and SGID (Set Group ID) are special permission bits in Linux that allow executable files
# to run with the privileges of their owner or group instead of the user who executes them (=> potential risk of privilege escalation or unauthorized access)
if [ -f "${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_sauv.txt" ]; then
    sudo find / -type f \( -perm -4000 -o -perm -2000 \) -exec ls {} \; 2> /dev/null | grep -v "/snap/" > "${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_current.txt"
    diff <(sort "${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_sauv.txt") <(sort "${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_current.txt")
    if [ $? -ne 0 ]; then
        print_error "list of files with special SUID or SGID permissions has changed (check changes and copy file ${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_current.txt to ${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_sauv.txt)"
    else
        print_success "files with special SUID or SGID permissions"
    fi
else
    print_warning "files with special SUID or SGID permissions check is skipped because reference file ${CHECKUP_FOLDER}/files_with_special_SUID_or_SGID_permissions_sauv.txt does not exist"
fi

# Check PATH environment variable
if [ "$PATH" == "$EXPECTED_PATH" ]; then
    print_success "PATH environment variable"
else
    echo "expected PATH: $EXPECTED_PATH"
    echo "current PATH:  $PATH"
    print_error "PATH environment variable has changed"
fi

# Check if /usr/local/sbin and /usr/local/bin folders contents
# This check is particularly useful if those folders are at the start of PATH environment variable before /usr/sbin and /usr/bin,
# for security reasons as they take precedence over programs installed by the system's package manager
# (adapt this check if programs in /usr/local/[s]bin folders are legitimate)
error_found=0
# - /usr/local/sbin
file_list=$(ls -A "/usr/local/sbin")
if ! [ -z "$file_list" ]; then
    echo $file_list
    print_error "/usr/local/sbin contains above local/manually-installed program(s)"
    error_found=1
fi
# - /usr/local/bin
# keep only installed apps in the list to be checked
EXPECTED_USR_LOCAL_BIN_PROGRAMS_INSTALLED=""
for program in $EXPECTED_USR_LOCAL_BIN_PROGRAMS; do
    if command -v "$program" > /dev/null 2>&1 || which "$program" > /dev/null 2>&1; then
        EXPECTED_USR_LOCAL_BIN_PROGRAMS_INSTALLED+="$program "
    fi
done
EXPECTED_USR_LOCAL_BIN_PROGRAMS_INSTALLED="${EXPECTED_USR_LOCAL_BIN_PROGRAMS_INSTALLED%"${EXPECTED_USR_LOCAL_BIN_PROGRAMS_INSTALLED##*[![:space:]]}"}"
file_list=$(ls -A "/usr/local/bin" | tr '\n' ' ')
file_list="${file_list%"${file_list##*[![:space:]]}"}"
if ! [ "$file_list" == "$EXPECTED_USR_LOCAL_BIN_PROGRAMS_INSTALLED" ]; then
    if [ -z "${file_list}" ]; then
        file_list="(none)"
    fi
    echo "$file_list"
    print_error "above /usr/local/bin local/manually-installed program(s) are unexpected"
    error_found=1
fi
if [ ${error_found} -eq 0 ]; then
    print_success "/usr/local/[s]bin folders contents"
fi

# Check "apt-get check" output
echo
sudo apt-get check > /dev/null
if [ $? -eq 0 ]; then
    print_success "apt-get check"
else
    print_error "apt-get check"
fi

echo
# Check firefox
if [ -d "${SNAP_FIREFOX_PROFILE_FOLDER}" ]; then
    error_found=0

    # Firefox settings
    firefox_contentblocking_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep "user_pref(\"browser.contentblocking.category\", \"standard\")")
    if [ -z "${firefox_contentblocking_setting}" ]; then
        print_error "firefox content blocking setting is not standard"
        error_found=1
    fi
    firefox_httpsonly_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep "user_pref(\"dom.security.https_only_mode\", true);")
    if [ -z "${firefox_httpsonly_setting}" ]; then
        print_error "firefox HTTPS-only setting is disabled"
        error_found=1
    fi
    firefox_autofillcard_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep "user_pref(\"extensions.formautofill.creditCards.enabled\", false);")
    if [ -z "${firefox_autofillcard_setting}" ]; then
        print_error "firefox autofill card setting is enabled"
        error_found=1
    fi

    firefox_blockpopups_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "dom.disable_open_during_load" | grep -i -P "(false|0)")
    if [ -n "${firefox_blockpopups_setting}" ]; then
        print_error "firefox block pop-ups setting is disabled"
        error_found=1
    fi
    # xpinstall.whitelist.required => whitelist
    firefox_addonsinstallwarning_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "whitelist" | grep -i -P "(false|0)")
    if [ -n "${firefox_addonsinstallwarning_setting}" ]; then
        print_error "firefox addons install warning setting is disabled"
        error_found=1
    fi
    firefox_malwareblocking_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "browser.safebrowsing.malware.enabled" | grep -i -P "(false|0)")
    if [ -n "${firefox_malwareblocking_setting}" ]; then
        print_error "firefox malware blocking setting is disabled"
        error_found=1
    fi
    firefox_phishingblocking_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "browser.safebrowsing.phishing.enabled" | grep -i -P "(false|0)")
    if [ -n "${firefox_phishingblocking_setting}" ]; then
        print_error "firefox phishing blocking setting is disabled"
        error_found=1
    fi
    firefox_dangerousdownloadblocking_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "browser.safebrowsing.downloads.enabled" | grep -i -P "(false|0)")
    if [ -n "${firefox_dangerousdownloadblocking_setting}" ]; then
        print_error "firefox dangerous download blocking setting is disabled"
        error_found=1
    fi
    firefox_dangerousuncommonsoftware_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "browser.safebrowsing.downloads.remote.block_uncommon" | grep -i -P "(false|0)")
    if [ -n "${firefox_dangerousuncommonsoftware_setting}" ]; then
        print_error "firefox uncommon software blocking setting is disabled"
        error_found=1
    fi
    # wider safebrowsing coverage
    firefox_safebrowsing_settings=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "safebrowsing" | grep -i "false")
    if [ -n "${firefox_safebrowsing_settings}" ]; then
        echo "${firefox_safebrowsing_settings}"
        print_error "above firefox safebrowsing settings are disabled"
        error_found=1
    fi
    # security.OCSP.enabled => OCSP
    firefox_ocspquery_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "OCSP" | grep -i -P "(false|0)")
    if [ -n "${firefox_ocspquery_setting}" ]; then
        print_error "firefox ocsp query setting is disabled"
        error_found=1
    fi
    # AI enhancements (option available in firefox settings / AI controls tab)
    firefox_ai_enhancements_setting=$(cat ${SNAP_FIREFOX_PROFILE_FOLDER}/prefs.js | grep -i "browser.ai.control.default" | grep -i -P "blocked")
    if [ -z "${firefox_ai_enhancements_setting}" ]; then
        print_error "firefox AI enhancements setting is not blocked"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "firefox settings"
    fi

    unexpected_firefox_extension_urls=$(grep -o '[^"/]*@[^"!]*' "${SNAP_FIREFOX_PROFILE_FOLDER}/extensions.json" | grep -v 'mozilla.org$' | grep -v 'mozilla.org.xpi$' | grep -v 'mozilla.com$' | grep -v 'mozilla.com.xpi$')
    if [ -n "${unexpected_firefox_extension_urls}" ]; then
        echo "${unexpected_firefox_extension_urls}"
        print_error "above firefox extensions URLs are unexpected"
        error_found=1
    fi

    unexpected_firefox_addon_urls=$(grep -o '[^"/]*@[^"!]*' "${SNAP_FIREFOX_PROFILE_FOLDER}/addons.json" | grep -v 'mozilla.org$' | grep -v 'mozilla.com$')
    if [ -n "${unexpected_firefox_addon_urls}" ]; then
        echo "${unexpected_firefox_addon_urls}"
        print_error "above firefox addons URLs are unexpected"
        error_found=1
    fi

    if [ -d "${CHECKUP_FOLDER}/firefox" ]; then
        # Firefox profile
        diff "${CHECKUP_FOLDER}/firefox/profiles_sauv.ini" "${SNAP_FIREFOX_FOLDER}/profiles.ini"
        if [ $? -ne 0 ]; then
            print_error "firefox profile has changed (${SNAP_FIREFOX_FOLDER}/profiles.ini)"
            error_found=1
        fi
        # Firefox extensions and plugins
        grep -oE '"name":"[^"]*"|"id":"[^"]*"|"sourceURI":"[^"]*"' "${CHECKUP_FOLDER}/firefox/addons_sauv.json" | sed 's/[0-9]\+/X/g' > "${CHECKUP_FOLDER}/firefox/addons_names_sauv_reformated.json"
        cat "${CHECKUP_FOLDER}/firefox/addons_names_sauv_reformated.json" | sort > "${CHECKUP_FOLDER}/firefox/addons_names_sauv_reformated_sorted.json"
        grep -oE '"name":"[^"]*"|"id":"[^"]*"|"sourceURI":"[^"]*"' "${SNAP_FIREFOX_PROFILE_FOLDER}/addons.json" | sed 's/[0-9]\+/X/g' > "${CHECKUP_FOLDER}/firefox/addons_names_current_reformated.json"
        cat "${CHECKUP_FOLDER}/firefox/addons_names_current_reformated.json" | sort > "${CHECKUP_FOLDER}/firefox/addons_names_current_reformated_sorted.json"
        sed 's/[0-9]\+/X/g' "${CHECKUP_FOLDER}/firefox/addons_sauv.json" | sed 's/},/},\n/g' > "${CHECKUP_FOLDER}/firefox/addons_sauv_reformated.json"
        sed 's/[0-9]\+/X/g' "${SNAP_FIREFOX_PROFILE_FOLDER}/addons.json" | sed 's/},/},\n/g' > "${CHECKUP_FOLDER}/firefox/addons_current_reformated.json"
        diff "${CHECKUP_FOLDER}/firefox/addons_names_sauv_reformated_sorted.json" "${CHECKUP_FOLDER}/firefox/addons_names_current_reformated_sorted.json"
        if [ $? -ne 0 ]; then
            print_error "above firefox addons have changed (check changes and copy file ${SNAP_FIREFOX_PROFILE_FOLDER}/addons.json to ${CHECKUP_FOLDER}/firefox/addons_sauv.json)"
            error_found=1
        fi
        # Below check is too strict so is commented:
        # diff "${CHECKUP_FOLDER}/firefox/addons_sauv_reformated.json" "${CHECKUP_FOLDER}/firefox/addons_current_reformated.json"
        # if [ $? -ne 0 ]; then
        #     print_warning "firefox addons have changed (${SNAP_FIREFOX_PROFILE_FOLDER}/addons.json)"
        # fi
        grep -oE '"name":"[^"]*"|"id":"[^"]*|"path":"[^"]*|"rootURI":"[^"]*"' "${CHECKUP_FOLDER}/firefox/extensions_sauv.json" | sed 's/[0-9]\+/X/g' > "${CHECKUP_FOLDER}/firefox/extensions_names_sauv_reformated.json"
        cat "${CHECKUP_FOLDER}/firefox/extensions_names_sauv_reformated.json" | sed -E 's|/features/[^/]+/|/features/xxx/|g' | sort > "${CHECKUP_FOLDER}/firefox/extensions_names_sauv_reformated_sorted.json"
        grep -oE '"name":"[^"]*"|"id":"[^"]*|"path":"[^"]*|"rootURI":"[^"]*"' "${SNAP_FIREFOX_PROFILE_FOLDER}/extensions.json" | sed 's/[0-9]\+/X/g' > "${CHECKUP_FOLDER}/firefox/extensions_names_current_reformated.json"
        cat "${CHECKUP_FOLDER}/firefox/extensions_names_current_reformated.json" | sed -E 's|/features/[^/]+/|/features/xxx/|g' | sort > "${CHECKUP_FOLDER}/firefox/extensions_names_current_reformated_sorted.json"
        sed 's/[0-9]\+/X/g' "${CHECKUP_FOLDER}/firefox/extensions_sauv.json" | sed 's/},/},\n/g' > "${CHECKUP_FOLDER}/firefox/extensions_sauv_reformated.json"
        sed 's/[0-9]\+/X/g' "${SNAP_FIREFOX_PROFILE_FOLDER}/extensions.json" | sed 's/},/},\n/g' > "${CHECKUP_FOLDER}/firefox/extensions_current_reformated.json"
        diff "${CHECKUP_FOLDER}/firefox/extensions_names_sauv_reformated_sorted.json" "${CHECKUP_FOLDER}/firefox/extensions_names_current_reformated_sorted.json"
        if [ $? -ne 0 ]; then
            print_error "above firefox extensions have changed (check changes and copy file ${SNAP_FIREFOX_PROFILE_FOLDER}/extensions.json to ${CHECKUP_FOLDER}/firefox/extensions_sauv.json)"
            error_found=1
        fi
        # Below check is too strict so is commented:
        # diff "${CHECKUP_FOLDER}/firefox/extensions_sauv_reformated.json" "${CHECKUP_FOLDER}/firefox/extensions_current_reformated.json"
        # if [ $? -ne 0 ]; then
        #     print_warning "firefox extensions have changed (${SNAP_FIREFOX_PROFILE_FOLDER}/extensions.json)"
        # fi

        if [ ${error_found} -eq 0 ]; then
            print_success "firefox install"
        fi
    else
        print_warning "firefox install check is partially skipped because reference folder ${CHECKUP_FOLDER}/firefox does not exist"
    fi
else
    print_error "firefox install check is skipped because firefox snap settings folder ${SNAP_FIREFOX_PROFILE_FOLDER} does not exist"
fi

default_browser=$(xdg-settings get default-web-browser)
firefox_as_default_browser=$(echo "$default_browser" | grep "firefox")
if [ -z "${firefox_as_default_browser}" ]; then
    print_warning "firefox is not the default browser (current default browser is $default_browser)"
fi

# Check chromium
if [ -d "${SNAP_CHROMIUM_FOLDER}" ]; then
    error_found=0

    # Chromium settings
    chromium_safebrowing_enabled=$(more "${SNAP_CHROMIUM_FOLDER}/Preferences" | grep -oE '"safebrowsing":{[^}]*}' | grep "\"enabled\":true")
    if [ -z "${chromium_safebrowing_enabled}" ]; then
        print_error "chromium browsing is not safe (disabling and then reenabling safe browsing in Chromium settings - Privacy and security - Security can make this check work)"
        error_found=1
    fi
    chromium_always_use_secure_connections_enabled=$(more "${SNAP_CHROMIUM_FOLDER}/Preferences" | grep "\"https_only_mode_enabled\":true")
    if [ -z "${chromium_always_use_secure_connections_enabled}" ]; then
        print_error "chromium 'always use secure connections' setting is disabled"
        error_found=1
    fi
    chromium_save_and_fill_payment_methods_disabled=$(more "${SNAP_CHROMIUM_FOLDER}/Preferences" | grep "\"credit_card_enabled\":false")
    if [ -z "${chromium_save_and_fill_payment_methods_disabled}" ]; then
        print_error "chromium 'save and fill payment methods' setting is enabled"
        error_found=1
    fi

    if [ ${error_found} -eq 0 ]; then
        print_success "chromium settings"
    fi
else
    print_error "chromium settings check is skipped because chromium snap settings folder ${SNAP_CHROMIUM_FOLDER} does not exist"
fi
# Chromium extensions
if [ -d "${SNAP_FOLDER}/chromium" ]; then
    # snap chromium extensions are located in ~/snap/chromium/.../Extensions
    chromium_extension_files=$(find ${SNAP_FOLDER}/chromium -type f -path "*Extensions*")
    if [ -n "${chromium_extension_files}" ]; then
        echo "${chromium_extension_files}"
        print_warning "chromium extensions were found, see above"
    else
        print_success "chromium extensions"
    fi
else
    print_error "chromium extensions check is skipped because chromium snap folder ${SNAP_FOLDER}/chromium does not exist"
fi

# Check libreoffice
error_found=0
# check required LibreOffice packages
required_lo_pkgs="libreoffice-core libreoffice-common libreoffice-writer libreoffice-calc libreoffice-impress libreoffice-gtk3"
for pkg in $required_lo_pkgs; do
    if ! dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q "install ok installed"; then
        print_error "LibreOffice component missing: $pkg"
        error_found=1
    fi
done
# check LibreOffice extensions
# (condition: <none> is not printed && there are actual extension lines after filtering)
unopkg_list=$(unopkg list)
if ( ! echo "$unopkg_list" | grep -q "<none>" ) && \
   ( echo "$unopkg_list" | grep -Ev "^(All deployed|Identifier|$|<none>)" >/dev/null ); then
    print_error "LibreOffice user extensions found ('unopkg list' to be run to see them)"
    error_found=1
fi
unopkg_list_shared=$(sudo unopkg list --shared)
if ( ! echo "$unopkg_list_shared" | grep -q "<none>" ) && \
   ( echo "$unopkg_list_shared" | grep -Ev "^(All deployed|Identifier|$|<none>)" >/dev/null ); then
    print_error "LibreOffice system‑wide extensions found ('sudo unopkg list --shared' to be run to see them)"
    error_found=1
fi
# check LibreOffice KDE integration
kde_plasma_installed=$(dpkg-query -W -f='${Status}\n' plasma-desktop plasma-workspace 2>/dev/null | grep -c "install ok installed")
if [ "$kde_plasma_installed" -ne 0 ]; then
    # if KDE Plasma is installed, LibreOffice KDE integration package (libreoffice-kfX) must match the KDE Frameworks major version (X) for proper integration
    libreoffice_kf_packages=$(dpkg-query -W -f='${Package}\n' 'libreoffice-kf*' 2>/dev/null)
    if [ "$libreoffice_kf_packages" == "" ]; then
        print_error "LibreOffice KDE integration package (libreoffice-kfX) is missing"
        error_found=1
    else
        # - extract LibreOffice KDE integration package (libreoffice-kfX) major version
        libreoffice_kf_version=$(echo "$libreoffice_kf_packages" | sed -E 's/.*libreoffice-kf([0-9]+).*/\1/' | sort -nr | head -n1)
        # - extract KDE Frameworks major version (highest available)
        kde_frameworks_version=$(dpkg-query -W -f='${Package}\n' 'libkf*coreaddons*' | sed -En 's/.*libkf([0-9]+)coreaddons.*/\1/p' | sort -nr | head -n1)
        # - compare versions
        if [ "$libreoffice_kf_version" != "$kde_frameworks_version" ]; then
            print_error "Wrong LibreOffice KDE integration: libreoffice-kf$libreoffice_kf_version does not match KDE Frameworks version $kde_frameworks_version"
            error_found=1
        fi
    fi
    # check if KDE VCL plugin library exists
    if ! ls /usr/lib*/libreoffice/program/libvclplug_kf*lo.so >/dev/null 2>&1; then
        print_error "KDE VCL plugin library is missing"
        error_found=1
    fi
fi
if [ ${error_found} -eq 0 ]; then
    print_success "libreoffice install"
fi

# Check interrupted package installations
interrupted_pkgs=$(dpkg-query -W -f='${db:Status-Abbrev} ${Package}\n' 2>/dev/null | grep -E '^.[Uf]')
if [ -n "$interrupted_pkgs" ]; then
    echo "$interrupted_pkgs"
    print_error "above package installations were interrupted ('sudo dpkg --configure -a' to be run)"
fi

# Check package files storage
echo
echo "checking package files storage..."
# - Possible error observed at sudo dpkg --verify execution: ??5?????? c /etc/apt/apt.conf.d/10periodic (means that properties in this file don't match the package's expectations, typically following customization via Software & Updates / Updates tab) => ignored because /etc/apt/apt.conf.d/10periodic file contents were already checked above
# - Errors like "missing     /usr/share/icons/LoginIcons" can be corrected by:
#   1) dpkg -S /usr/share/icons/LoginIcons => package name is displayed like "ubuntu-mono: /usr/share/icons/LoginIcons"
#   2) sudo apt reinstall ubuntu-mono => this command reinstalls the faulty package
# - When difference cannot be avoided by reinstalling source package or is normal due to customization, grep -v is piped to below command
dpkg_verify_status=$(sudo dpkg --verify | grep -v "/etc/apt/apt.conf.d/10periodic" | grep -v "/etc/cloud/templates/sources.list.debian.deb822.tmpl" | grep -v "/etc/cloud/templates/sources.list.ubuntu.deb822.tmpl" | grep -v "/etc/xdg/libkleopatrarc" | grep -v "/etc/update-manager/release-upgrades" | grep -v "/usr/lib/firmware/nvidia/") | grep -v "/usr/share/kio/servicemenus/kompare.desktop"
if [ -n "${dpkg_verify_status}" ]; then
    echo "${dpkg_verify_status}"
    print_error "errors in package files storage, possibly due to manual updates, file corruptions, file system errors on disk, see above (package reinstallation or package file restoration may be needed)"
else
    print_success "package files storage"
fi

# Check MD5 checksums
echo
error_found=0
if [ ${EXTENDED_CHECKS} -eq 0 ]; then
    echo "checking MD5 checksums..."

    # /lib and /usr/lib are not considered because processing can be long (set EXTENDED_CHECKS to 1 to check those folders too)
    find /bin /sbin /usr/bin /usr/sbin -type f -exec md5sum {} \; > /tmp/md5sums

    critical_bins=(
        # Core utilities
        "/bin/ls" "/bin/ps" "/bin/bash" "/bin/sh" "/bin/mount" "/bin/umount"
        "/bin/su" "/bin/login" "/bin/systemd"

        # Process and system monitoring
        "/usr/bin/top" "/usr/bin/htop" "/usr/bin/uptime" "/usr/bin/w" "/usr/bin/who"
        "/usr/bin/kill" "/usr/bin/killall" "/usr/bin/pstree" "/usr/bin/strace"
        "/usr/bin/lsof" "/usr/bin/time" "/usr/bin/watch"

        # Networking tools
        "/usr/bin/netstat" "/usr/bin/ss" "/usr/bin/ifconfig" "/usr/bin/ip"
        "/usr/bin/ping" "/usr/bin/traceroute" "/usr/bin/nmap"
        "/usr/bin/curl" "/usr/bin/wget" "/usr/bin/telnet" "/usr/bin/nc"

        # Authentication and privilege escalation
        "/usr/bin/sudo" "/usr/bin/passwd" "/usr/bin/chage" "/usr/bin/gpasswd"
        "/usr/bin/login" "/usr/bin/chsh" "/usr/bin/chfn"

        # File and system utilities
        "/usr/bin/find" "/usr/bin/locate" "/usr/bin/updatedb" "/usr/bin/file"
        "/usr/bin/which" "/usr/bin/whereis" "/usr/bin/realpath"

        # Package and service management
        "/usr/bin/systemctl" "/usr/bin/journalctl" "/usr/bin/dpkg" "/usr/bin/rpm"
        "/usr/bin/yum" "/usr/bin/apt" "/usr/bin/apt-get" "/usr/bin/apt-mark" "/usr/bin/snap"

        # SSH and remote access
        "/usr/bin/ssh" "/usr/sbin/sshd" "/usr/bin/scp" "/usr/bin/sftp"

        # Cron and scheduled tasks
        "/usr/sbin/crond" "/usr/bin/crontab"

        # Encryption and security
        "/usr/bin/gpg" "/usr/bin/openssl" "/usr/bin/ssh-keygen"

        # Misc
        "/usr/bin/env" "/usr/bin/xargs" "/usr/bin/awk" "/usr/bin/sed"
        "/usr/bin/diff" "/usr/bin/vi" "/usr/sbin/ufw" "/usr/sbin/smartctl"
        "/usr/sbin/aa-status" "/usr/bin/cp" "/usr/bin/more" "/usr/bin/less"
        "/usr/bin/cat"
    )
    for bin in "${critical_bins[@]}"; do
        if [[ -f "$bin" ]]; then
            md5sum "$bin" >> /tmp/md5sums
        fi
    done

    while read line; do
        hash=$(echo "$line" | cut -d' ' -f1)
        path=$(echo "$line" | cut -d' ' -f2-)
        filename=$(basename $path | sed 's/\[/\\[/g' | sed 's/\]/\\]/g')
        if ! grep "$hash" /var/lib/dpkg/info/*.md5sums | grep -q "$filename"; then
            print_error "MD5 checksum mismatch for $line"
            error_found=1
        fi
    done < /tmp/md5sums
    if [ ${error_found} -eq 0 ]; then
        print_success "MD5 checksums"
    fi
else
    # Check all files with an associated MD5 checksum (in addition to above checks done by sudo dpkg --verify). This step can be long.
    # Can be replaced by "sudo debsums -s" if you installed the optional debsums package.
    echo "checking all possible MD5 checksums (can be long)..."
    first_letter="NA"
    for md5file in /var/lib/dpkg/info/*.md5sums; do
        pkgname=$(basename "$md5file" .md5sums)
        current_first_letter="${pkgname:0:1}"
        if [[ "$current_first_letter" != "$first_letter" ]]; then
            echo "- checking /var/lib/dpkg/info/$current_first_letter*.md5sums files..."
            first_letter=$(echo "$current_first_letter")
        fi

        while IFS= read -r line; do
            # Extract expected hash and relative file path
            expected_hash=$(echo "$line" | cut -d' ' -f1)
            rel_path=$(echo "$line" | cut -d' ' -f2-)
            full_path="/${rel_path# }"
            if [[ -f "$full_path" ]]; then
                if [[ -r "$full_path" ]]; then
                    current_hash=$(md5sum "$full_path" | cut -d' ' -f1)
                    if [[ "$expected_hash" != "$current_hash" ]]; then
                        print_error "MD5 checksum mismatch for file listed in $md5file: $full_path ($expected_hash != $current_hash)"
                        error_found=1
                    fi
                else
                    # (above md5sum command was not intended to be called with sudo)
                    print_info "skipped because unaccessible: file listed in $md5file: $full_path"
                fi
            else
                print_info "missing file listed in $md5file: $full_path"
            fi

        done < "$md5file"
    done
    if [ ${error_found} -eq 0 ]; then
        print_success "all possible MD5 checksums"
    fi
fi

packages_installed=$(dpkg-query -W -f='${Package}\n' 2> /dev/null) # (list more packages than apt list --installed)
nb_packages_installed=$(echo "${packages_installed}" | wc -l)

# Check known unsafe files/folders/packages:

# 1a) Check non open-source (proprietary) licenses
while read -r line; do
    # Extract module name and license safely
    m="${line%% *}"          # module name = first field
    license="${line#* }"     # license = everything after first space (license can be multi-words)

    if [[ -z "$m" ]] ; then
        print_error "empty module listed"
        break;
    fi

    # Normalize license
    license_upper="${license^^}"

    # No license declared
    if [[ -z "$license" ]]; then
        print_error "no license declared: $m"
        continue
    fi
    # Unknown license
    if [[ "$license_upper" == "UNKNOWN" ]]; then
        print_error "unknown license: $m"
        continue
    fi
    # Acceptable open-source license keywords
    if [[ ! "$license_upper" =~ GPL ]]; then
    # could be replaced by more general condition for open-source licenses: if [[ ! "$license_upper" =~ GPL|BSD|MIT|MPL|APACHE|DUAL ]]; then
        print_error "non open-source license: $m ($license)"
    fi
done < <(
    awk '{print $1}' /proc/modules |
    while read -r mod; do
        lic=$(modinfo -F license "$mod" 2>/dev/null)
        echo "$mod $lic"
    done
)

# 1b) Check if a proprietary software or another taint flag has been loaded into the running kernel
# (bit 0 (TAINT_PROPRIETARY_MODULE) is the only taint bit that indicates proprietary code)
taint_val=$(cat /proc/sys/kernel/tainted 2>/dev/null)
if [[ -n "$taint_val" ]] && (( (taint_val & 1) != 0 )); then
    print_error "proprietary software detected by taint flag ($taint_val)"
fi

# 2) known unsafe packages (adapt as needed)
if echo "${packages_installed}" | grep -q "^vino"; then
    print_error "vino is installed (security risk)"
fi
if echo "${packages_installed}" | grep -q "^wine"; then
    print_error "wine is installed (security risk)"
fi
if echo "${packages_installed}" | grep -q "chrome"; then
    print_error "chrome is installed (snap chromium shall be preferred because open source)"
fi
if command -v kwallet-query &> /dev/null; then
    kde_wallet_unused=$(kwallet-query kdewallet -l 2> /dev/null | grep -E "Wallet kdewallet not found|The folder Passwords does not exist")
    if [ -z "${kde_wallet_unused}" ]; then
        print_warning "KDE wallet is used"
    fi
fi

# 3) known suspicious files or folders
known_suspicious_files=(
    # Known rootkit files
    "/usr/bin/ssh2" "/usr/sbin/in.telnetd" "/dev/.lib"
    "/dev/.static" "/dev/.golf" "/dev/.chr"
    "/dev/.rc" "/dev/.tty" "/etc/rc.d/rc.local"

    # Hidden or unusual binaries
    "/usr/bin/.../" "/usr/bin/.etc" "/usr/bin/.bash"
    "/usr/lib/libfltr.so" "/usr/lib/.fx" "/usr/lib/.gdm"
    "/usr/lib/.lib" "/usr/lib/.x" "/usr/lib/.z"

    # Suspicious folders
    "/dev/.udev" "/dev/.init" "/dev/.shadow"
    "/etc/.sysconfig" "/etc/.rc.d/init.d/.kthreadd"

    # Backdoor or persistence files
    "/etc/inetd.conf" "/etc/xinetd.conf" "/etc/ld.so.hash"
    "/usr/lib/libproc.a" "/usr/lib/libproc.so"

    # Deleted or hidden binaries
    "/tmp/.../" "/tmp/.X11-unix/.X0-lock" "/tmp/.X11-unix/.Xauth"
    "/var/tmp/.../" "/var/tmp/.X0-lock" "/var/tmp/.Xauth"

    # Kernel module hiding
    "/lib/modules/$(uname -r)/kernel/drivers/usb/hid/hid.ko"
    "/lib/modules/$(uname -r)/extra/.hidden"

    # Misc
    "/boot/System.map" "/boot/.vmlinuz" "/boot/.initrd"
)
for elt in "${known_suspicious_files[@]}"; do
    if [ -e "$elt" ]; then
        print_error "suspicious file or folder found: $elt"
    fi
done

# 4) basic suspicious keywords in module names
lsmod | grep -Ei "$SUSPICIOUS_KEYWORDS|inject" && print_error "suspicious module(s) found"
dpkg -l | grep -v "fonts-hack" | grep -Ei "$SUSPICIOUS_KEYWORDS|inject" && print_error "suspicious package(s) found"
# Note: if you install external tools like chkrootkit package, complex rootkit detections can be done

# dmks is generally used to install modules for HW support in Ubuntu, but can introduce specific risks regarding stability, security, and system maintenance
if command -v dkms &>/dev/null; then
    dkms status
    print_warning "dkms is installed"
fi

# Ubuntu ships snap by default, not flatpak
if command -v flatpak &>/dev/null; then
    flatpak list --app
    print_warning "flatpak is installed (Ubuntu ships snap by default, not flatpak)"
fi

apt_cache_policy_all_packages=$(apt-cache policy $(dpkg-query -W -f='${binary:Package}\n'))

# Check restricted packages
restricted_packages=$(echo "${apt_cache_policy_all_packages}" | grep -B5 'restricted')
if [ -n "$restricted_packages" ]; then
    echo "$restricted_packages"
    print_error "restricted packages are installed"
fi

# Check if some important drivers are missing, accepted exceptions are explicitly listed in below command
hw_devices_without_driver=$(sudo lshw | grep -A1 UNCLAIMED | grep -v '^--$' | sed 's/^[[:space:]]*//' | paste - - | grep -v "System peripheral" | grep -v "RAM memory" | grep -v "OEM Define 1")
if [ -n "$hw_devices_without_driver" ]; then
    echo "$hw_devices_without_driver"
    print_warning "above HW devices have no driver"
else
    print_success "drivers"
fi

# Check software not officially supported by Ubuntu
multiverse_packages=$(echo "${apt_cache_policy_all_packages}" | grep -B5 'multiverse')
if [ -n "$multiverse_packages" ]; then
    echo "$multiverse_packages"
    print_error "multiverse packages are installed"
fi

# Check backports packages
# oracular-backports software (manually installed packages from backports repository do not receive security updates / there can be occasionally compatibility issues => to avoid for stability and security reasons)
# (backports repository can be seen in Software & Updates / Other Software tab, and shall not be removed if automatically listed here)
backports_packages=$(echo "${apt_cache_policy_all_packages}" | grep -B5 'backports')
if [ -n "$backports_packages" ]; then
    echo "$backports_packages"
    print_error "backports packages are installed"
fi

# Check outdated cached packages
autoclean_outdated_cached_packages=$(sudo apt-get -s autoclean 2>/dev/null | grep -E '^(Del|Free)')
if [ -n "$autoclean_outdated_cached_packages" ]; then
    echo "$autoclean_outdated_cached_packages"
    print_warning "above cached packages are outdated ('sudo apt autoclean -y' to be run)"
fi

# Check obsolete packages
obsolete_packages=$(apt list ~o 2> /dev/null | grep -v "Listing...")
if [ -n "$obsolete_packages" ]; then
    echo "$obsolete_packages"
    print_warning "above packages are obsolete ('sudo apt remove --purge packagename' to be run)"
fi

possibly_useless_packages=$(apt autoremove --dry-run 2> /dev/null | grep -P "(REMOV|Remv)")
if [ -n "$possibly_useless_packages" ]; then
    echo "$possibly_useless_packages"
    print_warning "above packages may be useless ('sudo apt autoremove [--dry-run] --purge' to be run to remove them all)"
fi

# Check snap packages
echo
echo "checking snap packages..."
snap_error_found=0
if [ -f "${CHECKUP_FOLDER}/snap_list_sauv.txt" ]; then
    # option --all of snap list is not used here because package revisions order is undeterministic
    snap list > "${CHECKUP_FOLDER}/snap_list_current.txt"
    # reformat to only keep Name, Tracking, Publisher and Notes columns
    awk '{print $1, $4, $5, $6}' "${CHECKUP_FOLDER}/snap_list_sauv.txt" > "${CHECKUP_FOLDER}/snap_list_sauv_reformated.txt"
    awk '{print $1, $4, $5, $6}' "${CHECKUP_FOLDER}/snap_list_current.txt" > "${CHECKUP_FOLDER}/snap_list_current_reformated.txt"
    snap_list_sauv_contents_check=$(cat "${CHECKUP_FOLDER}/snap_list_sauv_reformated.txt" | grep "Name Tracking Publisher Notes")
    if [ -z "${snap_list_sauv_contents_check}" ]; then
        print_error "snap package list is not properly reformated (${CHECKUP_FOLDER}/snap_list_sauv_reformated.txt)"
        snap_error_found=1
    fi
    diff "${CHECKUP_FOLDER}/snap_list_sauv_reformated.txt" "${CHECKUP_FOLDER}/snap_list_current_reformated.txt"
    if [ $? -ne 0 ]; then
        print_error "snap package list has changed (check changes and copy file ${CHECKUP_FOLDER}/snap_list_current.txt to ${CHECKUP_FOLDER}/snap_list_sauv.txt)"
        snap_error_found=1
    fi
else
    print_warning "snap package list check is skipped because reference file "${CHECKUP_FOLDER}/snap_list_sauv.txt" does not exist"
fi
if ! systemctl is-active --quiet snapd; then
    print_error "snapd service is not running"
    snap_error_found=1
fi
if snap debug confinement | grep -v "strict"; then
    print_error "above default confinement mode for snap packages is not strict"
    snap_error_found=1
fi
if snap list --all | grep -v " canonical\*" | grep -v " kde\*" | grep -v " mozilla\*" | grep -v " openprinting\*" | grep -v " james-carroll\*" | grep -v "     Publisher     "; then # james-carroll for pinta snap package
    print_error "above snap packages have an unexpected publisher"
    snap_error_found=1
fi
if snap list --all | grep -v "/stable" | grep -v "     Publisher     "; then
    print_error "above snap packages are not stable"
    snap_error_found=1
fi
if snap list --all | grep -E " held|held$"; then
    print_error "above snap packages have updates disabled ('sudo snap refresh --unhold' to be run to enable updates)"
    snap_error_found=1
fi
snap_refresh_time=$(snap refresh --time | grep "timer: 00:00~24:00/4$") # every 4 hour each day is the default Ubuntu snap refresh schedule
if [ -z "${snap_refresh_time}" ]; then
    print_warning "unexpected snap refresh schedule:\n$(snap refresh --time)"
    snap_error_found=1
fi
snap_refresh_retain=$(sudo snap get system refresh.retain)
if ! [ ${snap_refresh_retain} -eq 2 ]; then
    print_error "snap refresh.retain is not set to its lowest possible value (2): old snap packages (which can be listed with 'snap list --all | grep disabled') can consume too much disk space ('sudo snap set system refresh.retain=2' to be run)"
    snap_error_found=1
fi
snap_package_info=$(snap list --all | awk 'NR>1 {print $1}' | while read snap; do echo "$snap: $(snap info --verbose $snap)"; done)
snap_package_confinements=$(echo "$snap_package_info" | grep 'confinement')
snap_packages_with_non_strict_confinement=$(echo "${snap_package_confinements}" | grep -v 'strict')
if [ -z "${snap_package_confinements}" ]; then
    print_error "no confinement found in snap packages info"
    snap_error_found=1
elif [ -n "${snap_packages_with_non_strict_confinement}" ]; then
    echo "${snap_packages_with_non_strict_confinement}"
    print_error "some snap packages are not installed with strict confinement"
    snap_error_found=1
fi
snap_package_urls=$(echo "$snap_package_info" | grep 'store-url')
snap_packages_with_unexpected_urls=$(echo "${snap_package_urls}" | grep -v 'https://snapcraft.io/')
if [ -z "${snap_package_urls}" ]; then
    print_warning "no store-url found in snap packages info (this warning can appear if no network connection)"
    snap_error_found=1
elif [ -n "${snap_packages_with_unexpected_urls}" ]; then
    echo "${snap_packages_with_unexpected_urls}"
    print_error "some snap packages are installed from an unexpected URL"
    snap_error_found=1
fi
snap_package_licenses=$(echo "$snap_package_info" | grep 'license:')
snap_packages_with_unexpected_licenses=$(echo "${snap_package_licenses}" | grep -v 'unset' | grep -v 'GPL' | grep -v 'MIT') # "license:   Proprietary" will be detected
if [ -z "${snap_package_licenses}" ]; then
    print_error "no license found in snap packages info"
    snap_error_found=1
elif [ -n "${snap_packages_with_unexpected_licenses}" ]; then
    echo "${snap_packages_with_unexpected_licenses}"
    print_error "some snap packages are installed with an unexpected license"
    snap_error_found=1
fi
snap_package_trackings=$(echo "$snap_package_info" | grep 'tracking:')
snap_packages_with_unexpected_trackings=$(echo "${snap_package_trackings}" | grep -v 'stable')
if [ -z "${snap_package_trackings}" ]; then
    print_error "no tracking found in snap packages info"
    snap_error_found=1
elif [ -n "${snap_packages_with_unexpected_trackings}" ]; then
    echo "${snap_packages_with_unexpected_trackings}"
    print_error "some snap packages are not installed from stable channel"
    snap_error_found=1
fi

check_snap_refresh_date() {
    package_name="$1"

    refresh_date=$(snap info "$package_name" | grep "refresh-date")

    if [[ $refresh_date =~ "today" ]]; then
        days=0
    elif [[ $refresh_date =~ "yesterday" ]]; then
        days=1
    elif [[ $refresh_date =~ "a day ago" ]]; then
        days=1
    elif [[ $refresh_date =~ "a month ago" ]]; then
        days=30
    elif [[ $refresh_date =~ "a year ago" ]]; then
        days=365
    elif [[ $refresh_date =~ "a week ago" ]]; then
        days=7
    elif [[ $refresh_date =~ ([0-9]+)\ ([a-zA-Z]+) ]]; then
        num=${BASH_REMATCH[1]}
        unit=${BASH_REMATCH[2]}

        case $unit in
            day|days)
                days=$num
                ;;
            week|weeks)
                days=$((num * 7))
                ;;
            month|months)
                days=$((num * 30))
                ;;
            year|years)
                days=$((num * 365))
                ;;
            *)
                print_error "check_snap_refresh_date: unknown time unit for snap package $package_name: $unit"
                snap_error_found=1
                return
                ;;
        esac
    elif [[ $refresh_date =~ ([0-9]{4})-([0-9]{2})-([0-9]{2}) ]]; then # example: refresh-date: 2025-02-08
        # Extract the date string
        date_str="${BASH_REMATCH[0]}"
        # Convert both dates to seconds since epoch
        refresh_epoch=$(date -d "$date_str" +%s)
        now_epoch=$(date +%s)
        # Calculate days difference
        days=$(( (now_epoch - refresh_epoch) / 86400 ))
    else
        print_error "check_snap_refresh_date: could not parse refresh date for snap package $package_name"
        snap_error_found=1
        return
    fi

    max_nb_days_for_refresh=45
    if (( days > $max_nb_days_for_refresh )); then
        print_warning "last refresh for snap package $package_name is old ($refresh_date)"
    fi
}
if snap list | grep -q "firefox"; then
    check_snap_refresh_date "firefox"
fi
if snap list | grep -q "chromium"; then
    check_snap_refresh_date "chromium"
fi

if snap saved | grep -v "No snapshots found."; then
    print_warning "above snap snapshots are stored ('sudo snap forget <snapshot_id>' to be run to forget them)"
fi
# check that some snap packages do not have access to internet for security reasons (pinta snap package here, if installed)
pinta_network_connection=$(snap connections | grep pinta | grep network)
if [ -n "${pinta_network_connection}" ]; then
    echo "${pinta_network_connection}"
    print_error "pinta snap package has internet access ('sudo snap disconnect pinta:network' to be run)"
    snap_error_found=1
fi
if [ ${snap_error_found} -eq 0 ]; then
  print_success "snap packages"
fi

# Check installed packages in details
echo
echo "checking installed packages in details..."
packages_with_updates_disabled=$(apt-mark showhold)
if [ -n "${packages_with_updates_disabled}" ]; then
    echo "${packages_with_updates_disabled}"
    print_error "above packages have updates disabled ('sudo apt-mark unhold' to be run to enable updates)"
fi
package_index=1
virtual_packages=""
nb_virtual_packages=0
for pkg in $(dpkg-query -W -f='${binary:Package}\n'); do
    pkg_policy=$(apt-cache policy "${pkg}")
    package_errors_str=""
    # Not-authenticated packages
    if ! $(echo "${pkg_policy}" | grep -q "500 http"); then
        package_errors_str="non-authenticated! ${package_errors_str}"
    fi
    repo_url=$(echo "${pkg_policy}" | grep -P "(http|https)://[^ ]+")
    # echo "${pkg}: ${repo_url}"
    if [ -z "${repo_url}" ]; then
        package_errors_str="no URL! ${package_errors_str}"
    fi
    # Official repository URLs as in ubuntu.sources file
    if echo "${repo_url}" | grep -v "http://archive.ubuntu.com/ubuntu" | grep -v "http://security.ubuntu.com/ubuntu" > /dev/null; then
        package_errors_str="non-official! ${package_errors_str}"
    fi
    if [ -n "${package_errors_str}" ]; then
        # Handle virtual packages like:
        # linux-image-*-generic
        # linux-modules-*-generic
        # linux-modules-extra-*-generic ...
        virtual_package=$(apt show "${pkg}" 2> /dev/null)
        virtual_package_status=$(echo "${virtual_package}" | grep "State: not a real package (virtual)")
        not_installed_status=$(echo "${pkg_policy}" | grep "Installed: (none)")
        if [ -n "${virtual_package_status}" ] && [ -n "${not_installed_status}" ]; then
            # print_info "${package_errors_str}for virtual package ${pkg}"
            virtual_packages="${virtual_packages} ${pkg}"
            nb_virtual_packages=$((nb_virtual_packages+1))
        else
            print_error "${package_errors_str}for package ${pkg}"
        fi
    fi

    # PPA (Personal Package Archive) packages (e.g. http://ppa.xxx) not available in official ubuntu repositories
    # example of PPA package: http://ppa.launchpad.net/libreoffice/ppa/...
    if echo "${repo_url}" | grep -q "/ppa"; then
        print_error "PPA package is installed (/ppa): ${pkg}"
    elif echo "${repo_url}" | grep -q "launchpad.net"; then
        print_error "PPA package is installed (launchpad.net): ${pkg}"
    fi

    percentage=$((100 * package_index / nb_packages_installed))
    if (( package_index == 50 )) || (( package_index == 100 )) || (( package_index == 200 )) || (( package_index % 400 == 0 )) || (( package_index == nb_packages_installed )); then
        echo "${percentage}% (${package_index}/${nb_packages_installed})"
    fi
    package_index=$((package_index+1))
done
if ! [ "${virtual_packages}" == "" ]; then
    print_info "${nb_virtual_packages} virtual package(s):${virtual_packages}"
fi
print_success "installed packages (see above logs for any warnings/errors)"

echo

warning_str="warning"
if [ ${nb_warnings} -ge 2 ]; then
    warning_str="warnings"
fi
error_str="error"
if [ ${nb_errors} -ge 2 ]; then
    error_str="errors"
fi
if [ ${nb_errors} -eq 0 ]; then
    if [ ${nb_warnings} -eq 0 ]; then
        echo -e "*** DONE ${GREEN}(success)${NC} ***"
    else
        echo -e "*** DONE ${YELLOW}with ${nb_warnings} ${warning_str}${NC} ***"
    fi
else
    if [ ${nb_warnings} -eq 0 ]; then
        echo -e "*** DONE ${RED}with ${nb_errors} ${error_str}${NC} ***"
    else
        echo -e "*** DONE ${RED}with ${nb_errors} ${error_str}${NC} + ${YELLOW}${nb_warnings} ${warning_str}${NC} ***"
    fi
fi

echo
read -p "Press Enter to start updates..."
echo

echo "---------- Updates ----------"
echo

${SCRIPT_FOLDER}/check_updates.sh
