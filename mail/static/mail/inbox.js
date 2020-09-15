
document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').addEventListener('submit', event => submit_email(event));

    // By default, load the inbox
    load_mailbox('inbox');

});


function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<p>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</p>`;

    fetch(`emails/${mailbox}`)
    .then(response => response.json())
    .then(result => {
        result.forEach(email => {
            console.log(email)

            const newEmail = document.createElement("div");
            newEmail.setAttribute("id", `email ${email.id}`);
            newEmail.setAttribute("data-id", email.id.toString());
            newEmail.setAttribute("data-mailbox", mailbox);
            if (email.read === false) {
                newEmail.setAttribute("class", "mailbox-new");
            } else {
                newEmail.setAttribute("class", "mailbox-new read");
            }

            const emailSendSub = document.createElement("div");
            emailSendSub.setAttribute("class", "mailbox-send-sub");
            emailSendSub.innerHTML = `<b>${email.sender}</b> ${email.subject}`
            newEmail.append(emailSendSub);

            const emailDate = document.createElement("div");
            emailDate.setAttribute("class", "mailbox-date");
            emailDate.innerHTML = email.timestamp;
            newEmail.append(emailDate);
            newEmail.addEventListener("click", load_email);
            document.querySelector("#emails-view").append(newEmail);
        });
    })

    .catch(err => {
        console.log(err)
    })
}


function submit_email(event) {
    event.preventDefault();
    console.log("posted");

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result)
        load_mailbox('sent');
    })
    .catch(err => {
        console.log(err)
    })
}


function load_email() {
    console.log(event)
    fetch(`/emails/${this.dataset.id}`)
    .then(response => response.json())
    .then(result => {

        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#email-view').style.display = 'block';

        document.querySelector('#email-info').innerHTML =
        `<b>From: </b>${result.sender}<br>
        <b>To: </b>${result.recipients.join(", ")}<br>
        <b>Subject: </b>${result.subject}</br>
        <b>Timestamp: </b>${result.timestamp}`;

        const archiEmail = document.querySelector("#archive");
        archiEmail.setAttribute("data-id", this.dataset.id.toString());
        archiEmail.setAttribute("data-archived", result.archived);
        archiEmail.style.display = "inline-block";
        if (this.dataset.mailbox === "inbox") {
            archiEmail.innerHTML = "Archive";
        } else if (this.dataset.mailbox === "archive") {
            archiEmail.innerHTML = "Unarchive";
        } else {
            archiEmail.style.display = "none";
        }

        archiEmail.addEventListener("click", archive_email);
        document.querySelector("#reply").addEventListener("click", () => reply_email(result));
        document.querySelector('#email-body').innerHTML = result.body

        fetch(`/emails/${result.id}`, {
            method: "PUT",
            body: JSON.stringify({
                read: true
            })
        })

        .then(response => response)
        .then(result => {
            console.log(result);
        })

        .catch(err => {
            console.log(err);
        });

    })

    .catch(err => {
        console.log(err)
    });
}


function archive_email() {

    fetch(`/emails/${this.dataset.id}`, {
        method: "PUT",
        body: JSON.stringify({
            archived: (this.dataset.archived === "true") ? false : true
        })
    })

    .then(response => response)
    .then(result => {
        load_mailbox('inbox');
    })

    .catch(err => {
        console.log(err);
    });
}


function reply_email(email) {

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-recipients').value = email.sender;

    const emailTest = /^Re: /i
    if (emailTest.test(email.subject)) {
        document.querySelector('#compose-subject').value = email.subject;
    } else {
        document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
}
