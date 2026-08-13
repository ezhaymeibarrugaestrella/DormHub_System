function idOf(value) {
    if (value == null) return null;
    if (typeof value === "string") return value;
    if (value._id != null) return value._id.toString();
    return value.toString();
}

function serializeUser(u) {
    if (!u) return null;
    return {
        id: u.id,
        student_id: u.student_id || null,
        fullname: u.fullname || null,
        email: u.email || null,
        role: u.role,
        program: u.program || null,
        year_section: u.year_section || null,
        room_number: u.room_number || null,
        fingerprint_id: u.fingerprint_id || null,
        profile_picture: u.profile_picture || null,
        status: u.status || "active",
        fingerprint_registered: Boolean(u.fingerprint_registered),
        address: u.address || null,
        parent_name: u.parent_name || null,
        parent_contact: u.parent_contact || null,
        parent_address: u.parent_address || null,
        registration_status: u.registration_status || null,
        registration_remarks: u.registration_remarks || null,
        created_at: u.created_at
    };
}

function serializeGateRequest(gr) {
    const user = gr.user_id && typeof gr.user_id === "object" ? gr.user_id : null;
    const approver = gr.approved_by && typeof gr.approved_by === "object" ? gr.approved_by : null;
    return {
        id: gr.id,
        user_id: idOf(gr.user_id),
        fullname: user ? user.fullname : undefined,
        student_id: user ? user.student_id : undefined,
        room_number: user ? user.room_number : undefined,
        request_type: gr.request_type,
        location_lat: gr.location_lat || null,
        location_lng: gr.location_lng || null,
        status: gr.status,
        approved_by: idOf(gr.approved_by),
        approved_by_name: approver ? approver.fullname : null,
        remarks: gr.remarks || null,
        fingerprint_verified: Boolean(gr.fingerprint_verified),
        created_at: gr.created_at,
        updated_at: gr.updated_at
    };
}

function serializeAttendanceLog(a) {
    const user = a.user_id && typeof a.user_id === "object" ? a.user_id : null;
    const marker = a.marked_by && typeof a.marked_by === "object" ? a.marked_by : null;
    return {
        id: a.id,
        user_id: idOf(a.user_id),
        fullname: user ? user.fullname : undefined,
        student_id: user ? user.student_id : undefined,
        program: user ? user.program : undefined,
        year_section: user ? user.year_section : undefined,
        date: a.date,
        time_in: a.time_in || null,
        time_out: a.time_out || null,
        status: a.status,
        remarks: a.remarks || null,
        marked_by: idOf(a.marked_by),
        marked_by_name: marker ? marker.fullname : null,
        location_lat: a.location_lat || null,
        location_lng: a.location_lng || null,
        created_at: a.created_at
    };
}

function serializeDemerit(d) {
    const user = d.user_id && typeof d.user_id === "object" ? d.user_id : null;
    return {
        id: d.id,
        user_id: idOf(d.user_id),
        fullname: user ? user.fullname : undefined,
        student_id: user ? user.student_id : undefined,
        room_number: user ? user.room_number : undefined,
        program: user ? user.program : undefined,
        violation: d.violation,
        points: d.points,
        remarks: d.remarks || null,
        created_at: d.created_at
    };
}

module.exports = {
    idOf,
    serializeUser,
    serializeGateRequest,
    serializeAttendanceLog,
    serializeDemerit
};
