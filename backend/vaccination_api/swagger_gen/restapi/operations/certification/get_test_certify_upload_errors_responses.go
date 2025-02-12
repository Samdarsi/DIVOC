// Code generated by go-swagger; DO NOT EDIT.

package certification

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"
)

// GetTestCertifyUploadErrorsOKCode is the HTTP code returned for type GetTestCertifyUploadErrorsOK
const GetTestCertifyUploadErrorsOKCode int = 200

/*GetTestCertifyUploadErrorsOK OK

swagger:response getTestCertifyUploadErrorsOK
*/
type GetTestCertifyUploadErrorsOK struct {

	/*
	  In: Body
	*/
	Payload interface{} `json:"body,omitempty"`
}

// NewGetTestCertifyUploadErrorsOK creates GetTestCertifyUploadErrorsOK with default headers values
func NewGetTestCertifyUploadErrorsOK() *GetTestCertifyUploadErrorsOK {

	return &GetTestCertifyUploadErrorsOK{}
}

// WithPayload adds the payload to the get test certify upload errors o k response
func (o *GetTestCertifyUploadErrorsOK) WithPayload(payload interface{}) *GetTestCertifyUploadErrorsOK {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the get test certify upload errors o k response
func (o *GetTestCertifyUploadErrorsOK) SetPayload(payload interface{}) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *GetTestCertifyUploadErrorsOK) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(200)
	payload := o.Payload
	if err := producer.Produce(rw, payload); err != nil {
		panic(err) // let the recovery middleware deal with this
	}
}

// GetTestCertifyUploadErrorsForbiddenCode is the HTTP code returned for type GetTestCertifyUploadErrorsForbidden
const GetTestCertifyUploadErrorsForbiddenCode int = 403

/*GetTestCertifyUploadErrorsForbidden Forbidden for user

swagger:response getTestCertifyUploadErrorsForbidden
*/
type GetTestCertifyUploadErrorsForbidden struct {
}

// NewGetTestCertifyUploadErrorsForbidden creates GetTestCertifyUploadErrorsForbidden with default headers values
func NewGetTestCertifyUploadErrorsForbidden() *GetTestCertifyUploadErrorsForbidden {

	return &GetTestCertifyUploadErrorsForbidden{}
}

// WriteResponse to the client
func (o *GetTestCertifyUploadErrorsForbidden) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.Header().Del(runtime.HeaderContentType) //Remove Content-Type on empty responses

	rw.WriteHeader(403)
}

// GetTestCertifyUploadErrorsNotFoundCode is the HTTP code returned for type GetTestCertifyUploadErrorsNotFound
const GetTestCertifyUploadErrorsNotFoundCode int = 404

/*GetTestCertifyUploadErrorsNotFound certify upload for given uploadID not found

swagger:response getTestCertifyUploadErrorsNotFound
*/
type GetTestCertifyUploadErrorsNotFound struct {
}

// NewGetTestCertifyUploadErrorsNotFound creates GetTestCertifyUploadErrorsNotFound with default headers values
func NewGetTestCertifyUploadErrorsNotFound() *GetTestCertifyUploadErrorsNotFound {

	return &GetTestCertifyUploadErrorsNotFound{}
}

// WriteResponse to the client
func (o *GetTestCertifyUploadErrorsNotFound) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.Header().Del(runtime.HeaderContentType) //Remove Content-Type on empty responses

	rw.WriteHeader(404)
}
