import { LightningElement, api, track, wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getEmailsByRecordId from '@salesforce/apex/CaseEmailForwarder.getEmailsByRecordId';
import forwardSelectedEmails from '@salesforce/apex/CaseEmailForwarder.forwardSelectedEmails';

const COLUMNS = [
    { 
        label: 'Subject', 
        fieldName: 'subject', 
        type: 'text', 
        sortable: true,
        wrapText: true,
        initialWidth: 300
    },
    { 
        label: 'From', 
        fieldName: 'fromAddress', 
        type: 'text', 
        sortable: true,
        initialWidth: 200
    },
    { 
        label: 'To', 
        fieldName: 'toAddress', 
        type: 'text', 
        sortable: true,
        initialWidth: 200
    },
    { 
        label: 'Date', 
        fieldName: 'formattedDate', 
        type: 'text', 
        sortable: true,
        initialWidth: 160
    },
    { 
        label: 'Direction', 
        fieldName: 'direction', 
        type: 'text', 
        sortable: true,
        initialWidth: 100
    }
];

export default class EmailForwarderModal extends LightningElement {
    @api recordId;
    
    @track emails = [];
    @track selectedEmailIds = [];
    @track isLoading = true;
    @track error = undefined;
    @track sortedBy = 'formattedDate';
    @track sortedDirection = 'desc';
    @track isSending = false;
    
    // Recipient email - can be made configurable via design attribute
    @track recipientEmail = 'annindya.das@aig.com';
    
    columns = COLUMNS;
    
    // Computed property to show content (not loading and no error)
    get showContent() {
        return !this.isLoading && !this.error;
    }

    get hasEmails() {
        return this.emails && this.emails.length > 0;
    }

    get noEmails() {
        return !this.hasEmails;
    }
    
    get hasSelectedEmails() {
        return this.selectedEmailIds && this.selectedEmailIds.length > 0;
    }
    
    get selectedCount() {
        return this.selectedEmailIds.length;
    }
    
    get totalCount() {
        return this.emails.length;
    }
    
    get sendButtonLabel() {
        if (this.isSending) {
            return 'Sending...';
        }
        return this.selectedCount > 0 
            ? `Send ${this.selectedCount} Email(s)` 
            : 'Send';
    }
    
    get isSendDisabled() {
        return !this.hasSelectedEmails || this.isSending || !this.recipientEmail;
    }

    get modalTitle() {
        return `Forward Emails (${this.totalCount} available)`;
    }

    // Wire adapter to get emails for the current record
    @wire(getEmailsByRecordId, { recordId: '$recordId' })
    wiredEmails({ error, data }) {
        this.isLoading = false;
        if (data) {
            this.emails = [...data];
            this.error = undefined;
            // Apply initial sorting
            this.sortData(this.sortedBy, this.sortedDirection);
        } else if (error) {
            this.error = this.reduceErrors(error);
            this.emails = [];
        }
    }

    // Handle row selection in the datatable
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedEmailIds = selectedRows.map(row => row.id);
    }

    // Handle column sorting
    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortedBy = fieldName;
        this.sortedDirection = sortDirection;
        this.sortData(fieldName, sortDirection);
    }

    // Sort the data based on field and direction
    sortData(fieldName, direction) {
        const parseData = JSON.parse(JSON.stringify(this.emails));
        
        const keyValue = (a) => {
            return a[fieldName] ? String(a[fieldName]).toLowerCase() : '';
        };
        
        const isReverse = direction === 'asc' ? 1 : -1;
        
        parseData.sort((x, y) => {
            x = keyValue(x);
            y = keyValue(y);
            return isReverse * ((x > y) - (y > x));
        });
        
        this.emails = parseData;
    }

    // Handle recipient email input change
    handleRecipientChange(event) {
        this.recipientEmail = event.target.value;
    }

    // Handle the Send button click
    async handleSend() {
        if (!this.hasSelectedEmails) {
            this.showToast('Warning', 'Please select at least one email to forward.', 'warning');
            return;
        }

        if (!this.recipientEmail) {
            this.showToast('Warning', 'Please enter a recipient email address.', 'warning');
            return;
        }

        this.isSending = true;

        try {
            const result = await forwardSelectedEmails({ 
                emailIds: this.selectedEmailIds, 
                recipientEmail: this.recipientEmail 
            });
            
            this.showToast('Success', result, 'success');
            this.handleClose();
        } catch (error) {
            this.showToast('Error', this.reduceErrors(error), 'error');
        } finally {
            this.isSending = false;
        }
    }

    // Handle the Close button click
    handleClose() {
        // Dispatch close event for action screen
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    // Show toast notification
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
                mode: 'dismissable'
            })
        );
    }

    // Reduce errors to a readable string
    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }

        return errors
            .filter(error => !!error)
            .map(error => {
                if (typeof error === 'string') {
                    return error;
                }
                if (error.body) {
                    if (typeof error.body.message === 'string') {
                        return error.body.message;
                    }
                    if (error.body.fieldErrors) {
                        return Object.values(error.body.fieldErrors)
                            .flat()
                            .map(e => e.message)
                            .join(', ');
                    }
                }
                if (error.message) {
                    return error.message;
                }
                return JSON.stringify(error);
            })
            .join(', ');
    }
}
