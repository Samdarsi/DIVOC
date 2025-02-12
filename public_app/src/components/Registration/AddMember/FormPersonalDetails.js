import React, {useEffect, useState} from "react";
import {Col, Container, Row} from "react-bootstrap";
import {CustomButton} from "../../CustomButton";
import {maskPersonalDetails} from "../../../utils/maskPersonalDetails";
import axios from "axios";
import {CITIZEN_TOKEN_COOKIE_NAME, RECIPIENTS_API} from "../../../constants";
import {getUserNumberFromRecipientToken} from "../../../utils/reciepientAuth";
import {getCookie} from "../../../utils/cookies";
import {
    AADHAAR_ERROR_MESSAGE,
    DISTRICT_ERROR_MSG,
    EMAIL_ERROR_MESSAGE,
    GENDER_ERROR_MSG,
    INVALID_NAME_ERR_MSG,
    MAXIMUM_LENGTH_OF_NAME_ERROR_MSG,
    MINIMUM_LENGTH_OF_NAME_ERROR_MSG,
    NAME_ERROR_MSG,
    NATIONAL_ID_ERROR_MSG,
    NATIONAL_ID_TYPE_ERROR_MSG,
    PINCODE_ERROR_MESSAGE,
    STATE_ERROR_MSG,
    DUPLICATE_NAME_YOB,
    DUPLICATE_NATIONAL_ID_ERR_MSG,
    NATIONALITY_ERROR_MSG
} from "./error-constants";
import {isInValidAadhaarNumber, isValidName, isValidPincode} from "../../../utils/validations";
import {constuctNationalId, getNationalIdNumber, getNationalIdType, ID_TYPES} from "../../../utils/national-id";
import {useTranslation} from "react-i18next";

const GENDERS = [
    "Male",
    "Female",
    "Other"
];

const RESPONSIVE_COL_CLASS = "col-lg-7 col-md col-sm-10";
const RESPONSIVE_ROW_DIV_CLASS = "p-0 pt-2 col-lg-6 col-md-6 col-sm-12";

export const FormPersonalDetails = ({ setValue, formData, navigation, verifyDetails, members, header, footer}) => {
    //"did:in.gov.uidai.aadhaar:11111111111", "did:in.gov.driverlicense:KA53/2323423"

    const { previous, next } = navigation;
    const [errors, setErrors] = useState({});
    const [stateAndDistricts, setStateAndDistricts] = useState({});
    const [nationalities, setNationalities] = useState([]);
    const {t} = useTranslation();

    useEffect(() => {
        const data = {
            "entityContext": {},
            "flagKey": "country_specific_features"
        };
        axios
            .post("/config/api/v1/evaluation", data)
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.log(err)
            })
            .then((result) => {
                if(result["variantAttachment"]) {
                    setStateAndDistricts(result["variantAttachment"].stateAndDistricts || {})
                    setNationalities(result["variantAttachment"].nationalities || [])
                } else {
                    console.error("country specific criteria is not configure");
                }
            })
    }, []);

    function validateUserDetails() {
        const errors = {}
        const nationalIDType = getNationalIdType(formData.identity)
        const nationIDNumber = getNationalIdNumber(formData.identity)

        if(!nationalIDType) {
            errors.nationalIDType = t('errors.nationalIdTypeErr')
        }
        if(!nationIDNumber) {
            errors.identity = t('errors.nationalIdNumberErr');
        } else {
            if(nationalIDType === ID_TYPES[0].value && isInValidAadhaarNumber(nationIDNumber)) {
                errors.aadhaar = t('errors.aadhaarErr')
            }
        }

        if (members.filter(m => m.identity === formData.identity).length > 0) {
            errors.identity = t('errors.duplicateNationalIdErr')
        }

        if(!formData.name) {
            errors.name = t('errors.beneficiaryNameRequired')
        } else if (formData.name.length < 2){
            errors.name = t('errors.nameMinLength')
        } else if (formData.name.length > 99) {
            errors.name = t('errors.nameMaxLength')
        } else {
            if(!isValidName(formData.name)) {
                errors.name = t('errors.nameAlphabetOnly')
            } else if (members.filter(m => (m.name == formData.name) && (m.yob == formData.yob)).length > 0) {
                errors.name = t('errors.nameDuplicate');
            }
        }
        if(!formData.state) {
            errors.state = t('errors.stateRequired')
        }
        if(!formData.district) {
            errors.district = t('errors.districtRequired')
        }

        if(!formData.nationalId) {
            errors.nationalId = t('errors.nationalityRequired')
        }

        if(formData.pincode && !isValidPincode(formData.pincode)) {
            errors.pincode = t('errors.pincodeInvalid')
        }

        if(!formData.gender) {
            errors.gender = t('errors.genderRequired')
        }
        if (formData.email != "" && formData.email != formData.confirmEmail) {
            errors.email = t('errors.emailMismatch')
        }

        setErrors(errors)
        return Object.values(errors).filter(e => e).length > 0
        // TODO: add validations before going to confirm screen
    }

    const onContinue = () => {
        if (validateUserDetails()) {
            alert("Errors found in submission. Please retry")
        } else {
            next()
        }
    };

    const onSubmit = () => {
        // TODO: refactor fields of formData itself to match api body
        let dataToSend = {...formData};
        delete dataToSend["state"];
        delete dataToSend["district"];
        delete dataToSend["contact"];
        delete dataToSend["pincode"];
        delete dataToSend["locality"];
        delete dataToSend["programId"]
        dataToSend["yob"] = parseInt(dataToSend["yob"]);
        dataToSend["address"] = {
            "addressLine1": "",
            "addressLine2": "",
            "state": "",
            "district": "",
            "pincode": ""
        };
        dataToSend["address"]["addressLine2"] = formData.locality;
        dataToSend["address"]["state"] = formData.state;
        dataToSend["address"]["district"] = formData.district;
        dataToSend["address"]["pincode"] = formData.pincode;
        dataToSend["phone"] = getUserNumberFromRecipientToken();
        dataToSend["beneficiaryPhone"] = formData.contact
        // While registering the user, By default user will be assigned to the selected program with dose 1
        dataToSend["appointments"] = [{
            "programId": formData.programId,
            "dose": "1",
            "comorbidities": formData.comorbidities
        }]
        const token = getCookie(CITIZEN_TOKEN_COOKIE_NAME);
        const config = {
            headers: {"Authorization": token, "Content-Type": "application/json"},
        };
        axios.post(RECIPIENTS_API, dataToSend, config)
            .then(res => {
                if (res.status === 200) {
                    next()
                }
            })
            .catch(err => {
                alert("Error while registering, please try again later.\n" + err);
            });
    };
    return (
        <Container fluid>
            <div className="side-effect-container">
                {
                    header ? header : <h3>{verifyDetails ? t('registration.formDetails.verifyBeneficiaryTitle') : t('registration.formDetails.addBeneficiaryTitle')}</h3>
                }

                <div className="shadow-sm bg-white form-container">
                    <IdDetails  verifyDetails={verifyDetails} formData={formData} setValue={setValue} errors={errors}/>
                    <BeneficiaryDetails verifyDetails={verifyDetails} formData={formData} setValue={setValue} errors={errors} stateAndDistricts={stateAndDistricts} nationalities={nationalities}/>
                    <ContactInfo verifyDetails={verifyDetails} formData={formData} setValue={setValue} errors={errors}/>
                </div>
                {
                    footer ? footer : <div className="pt-3">
                        <CustomButton isLink={true} type="submit" onClick={previous}>
                            <span>{t('button.back')}</span>
                        </CustomButton>
                        { !verifyDetails &&
                        <CustomButton className="blue-btn" type="submit" onClick={onContinue}>
                            <span>{t('button.continue')} &#8594;</span>
                        </CustomButton>
                        }
                        { verifyDetails &&
                        <CustomButton className="blue-btn" type="submit" onClick={onSubmit}>
                            <span>{t('button.confirm')}</span>
                        </CustomButton>
                        }
                    </div>
                }
            </div>
        </Container>

    )
}

const ContactInfo = ({verifyDetails, formData, setValue, errors}) => {

    const userMobileNumber = getUserNumberFromRecipientToken();
    const {t} = useTranslation();

    return (
        <div className="pt-5">
            <h5>{t('registration.formDetails.contactInfoTitle')}</h5>
            <Row className="pt-2">
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label"} htmlFor="mobile">
                            {t('registration.formDetails.mobileLabel')}
                        </label>
                        { !verifyDetails && <div className="radio-group">

                            <div className="pb-2">

                                <label className="form-check-label" htmlFor="defaultContact">
                                    {userMobileNumber}
                                </label>
                            </div>
                        </div>
                        }
                        {
                            verifyDetails &&
                            <><br/><p>{formData.contact}</p></>
                        }
                    </Col>
                </div>
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label"} hidden={verifyDetails && !formData.email} htmlFor="email">
                            {t('registration.formDetails.emailLabel')}
                        </label>
                        <div hidden={verifyDetails}>
                            <input className="form-control" id="email" name="email" type="text"
                                   placeholder={t('registration.formDetails.emailPlaceholder')}
                                   defaultValue={maskPersonalDetails(formData.email, true)}
                                   onBlur={(evt) => evt.target.value = maskPersonalDetails(evt.target.value, true)}
                                   onFocus={(evt) => evt.target.value = formData.email}
                                   onChange={(e) => setValue({target: {name:"email", value:e.target.value}})}/>
                            <div className="pt-2">
                                <label hidden={verifyDetails && !formData.email} htmlFor="confirmEmail">
                                    {t('registration.formDetails.verifyEmailLabel')}
                                </label>
                                <input className="form-control" id="confirmEmail" name="email" type="text"
                                       placeholder={t('registration.formDetails.confirmEmailPlaceholder')}
                                       value={formData.confirmEmail}
                                       onPaste={(e) => {e.preventDefault()}}
                                       onDrag={(e) => {e.preventDefault()}}
                                       onDrop={(e) => {e.preventDefault()}}
                                       onChange={(e) => setValue({target: {name:"confirmEmail", value:e.target.value}})}
                                />
                            </div>
                            <div className="invalid-input">
                                {errors.email}
                            </div>
                        </div>
                        {
                            verifyDetails &&
                            <><br/><p>{maskPersonalDetails(formData.email)}</p></>
                        }
                    </Col>
                </div>
            </Row>
        </div>
    )
};

const IdDetails = ({verifyDetails, formData, setValue, errors}) => {
    const {t} = useTranslation();

    function getSelectedIdType() {
        const preSelectedIdValue = formData.identity ? getNationalIdType(formData.identity): undefined;
        return preSelectedIdValue ? ID_TYPES.filter(a => a.value === preSelectedIdValue)[0].name: ""
    }

    function onIdChange(event, type) {
        if (type === "idType") {
            const idValue = event.target.value;
            let existingIdNumber = "";
            if (formData.identity) {
                const nationalIdNumber = getNationalIdNumber(formData.identity);
                existingIdNumber = nationalIdNumber ? nationalIdNumber: ""
            }
            let identity = constuctNationalId(idValue, existingIdNumber)
            setValue({target: {name:"identity", value:identity}})
        } else if (type === "idNumber") {
            const idNumber = event.target.value;
            let existingIdType = "";
            if (formData.identity) {
                const nationalIdType = getNationalIdType(formData.identity);
                existingIdType = nationalIdType ? nationalIdType: "";
            }
            let identity = constuctNationalId(existingIdType, idNumber);
            setValue({target: {name:"identity", value:identity}})
        }
    }

    return (
        <div>
            <h5>{t('registration.formDetails.idDetails')}</h5>
            <Row className="pt-2">
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="idType">{t('registration.formDetails.idTypeLabel')}</label>
                        <select className="form-control" id="idType"
                                hidden={verifyDetails}
                                placeholder="Select ID Type"
                                onChange={(e) => onIdChange(e, "idType")}>
                            <option disabled selected={!getSelectedIdType()} value>{t('registration.formDetails.selectIdType')}</option>
                            {
                                ID_TYPES.map(d => <option selected={d.name === getSelectedIdType()} value={d.value}>{d.name}</option>)
                            }
                        </select>
                        <div className="invalid-input">
                            {errors.nationalIDType}
                        </div>
                        {
                            verifyDetails &&
                            <p>{getSelectedIdType()}</p>
                        }
                    </Col>
                </div>
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="idNumber">
                            {t('registration.formDetails.idNumberLabel')}
                        </label>
                        <input className="form-control" id="idNumber"
                               hidden={verifyDetails}
                               type="text" placeholder={t('registration.formDetails.idNumberPlaceholder')}
                               defaultValue={getNationalIdNumber(formData.identity)}
                               onBlur={(e) => onIdChange(e, "idNumber")}/>
                        <div className="invalid-input">
                            {errors.identity}

                        </div>
                        <div className="invalid-input">
                            {errors.aadhaar}
                        </div>
                        {
                            verifyDetails &&
                            <p>{getNationalIdNumber(formData.identity)}</p>
                        }
                    </Col>
                </div>
            </Row>
            <Row className="pt-2">
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="name">
                            {t('registration.formDetails.nameLabel')}
                        </label>
                        <input className="form-control" name="name" id="name" type="text"
                               hidden={verifyDetails}
                               placeholder={t('registration.formDetails.namePlaceholder')}
                               defaultValue={formData.name}
                               onBlur={setValue}/>
                        <div className="invalid-input">
                            {errors.name}
                        </div>
                        {
                            verifyDetails &&
                            <p>{formData.name}</p>
                        }
                    </Col>
                </div>
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label"} htmlFor="name">
                            {t('registration.formDetails.ageLabel')}
                        </label>
                        <div> {new Date().getFullYear() - formData.yob} Years </div>
                    </Col>
                </div>
            </Row>
            <Row className="pt-2">
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="gender">
                            {t('registration.formDetails.genderLabel')}
                        </label>
                        <select className="form-control" id="gender" name="gender" onChange={setValue} hidden={verifyDetails}>
                            <option disabled selected={!formData.gender} value>{t('registration.formDetails.genderPlaceholder')}</option>
                            {
                                GENDERS.map(id => <option selected={id === formData.gender} value={id}>{id}</option>)
                            }
                        </select>
                        {
                            verifyDetails &&
                            <><br/><p>{formData.gender}</p></>
                        }
                        <div className="invalid-input">
                            {errors.gender}
                        </div>
                    </Col>
                </div>
            </Row>
        </div>
    )
};

const BeneficiaryDetails = ({verifyDetails, formData, setValue, errors, stateAndDistricts, nationalities}) => {

    const [districts, setDistricts] = useState([]);
    const {t} = useTranslation();

    useEffect(() => {
        setDistictsForState(formData.state)
    }, [stateAndDistricts]);

    function onStateSelected(stateSelected) {
        setValue({target: {name:"state", value:stateSelected}});
        setValue({target: {name:"district", value:""}});
        setDistictsForState(stateSelected)
    }

    function setDistictsForState(state) {
        const stateObj = Object.values((stateAndDistricts['states'] || [])).find(obj => obj.name === state);
        if (stateObj) {
            setDistricts(stateObj.districts)
        } else {
            setDistricts([])
        }
    }

    function setDobValue(dob) {
        setValue({target: {name:"dob", value:dob}})
    }
    // const minDate = new Date();
    // minDate.setYear(minDate.getYear() - maxAge);
    return (
        <div className="pt-5">
            <h5>{t('registration.formDetails.residenceDetails')}</h5>
            <Row className="pt-2">
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="state">
                            {t('registration.formDetails.stateLabel')}
                        </label>
                        <select className="form-control" name="state" id="state"
                                onChange={(e) => onStateSelected(e.target.value)}
                                hidden={verifyDetails}>
                            <option disabled selected={!formData.state} value>{t('registration.formDetails.statePlaceholder')}</option>
                            {
                                (stateAndDistricts['states'] || []).map(obj => obj.name).map(id => <option selected={id === formData.state} value={id}>{id}</option>)
                            }
                        </select>
                        <div className="invalid-input">
                            {errors.state}
                        </div>
                        {
                            verifyDetails &&
                            <p>{formData.state}</p>
                        }
                    </Col>
                </div>
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="district">
                            {t('registration.formDetails.districtLabel')}
                        </label>
                        <select className="form-control" id="district" name="district" onChange={setValue} hidden={verifyDetails}>
                            <option disabled selected={!formData.district} value>{t('registration.formDetails.districtPlaceholder')}</option>
                            {
                                districts.map(d => <option selected={d.name === formData.district} value={d.name}>{d.name}</option>)
                            }
                        </select>
                        <div className="invalid-input">
                            {errors.district}
                        </div>
                        {
                            verifyDetails &&
                            <p>{formData.district}</p>
                        }
                    </Col>
                </div>
            </Row>
            <Row className="pt-2">
                <div className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label className={verifyDetails ? "custom-verify-text-label" : "custom-text-label required"} htmlFor="nationalId">
                            {t('registration.formDetails.nationalityLabel')}
                        </label>
                        <select className="form-control" name="nationalId" id="nationalId"
                                onChange={setValue}
                                hidden={verifyDetails}>
                            <option disabled selected={!formData.nationalId} value>{t('registration.formDetails.nationalityPlaceholder')}</option>
                            {
                                nationalities.map(id => <option selected={id === formData.nationalId} value={id}>{id}</option>)
                            }
                        </select>
                        <div className="invalid-input">
                            {errors.nationalId}
                        </div>
                        {
                            verifyDetails &&
                            <p>{formData.nationalId}</p>
                        }
                    </Col>
                </div>
                <div hidden={verifyDetails && !formData.pincode} className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label
                               className={verifyDetails ? "custom-verify-text-label" : "custom-text-label"}
                               htmlFor="locality">
                            {t('registration.formDetails.localityLabel')}
                        </label>
                        <input className="form-control" name="locality" id="locality" type="text"
                               hidden={verifyDetails}
                               placeholder={t('registration.formDetails.localityPlaceholder')}
                               defaultValue={formData.locality}
                               onBlur={setValue}/>
                        {
                            verifyDetails &&
                            <p>{formData.locality}</p>
                        }
                    </Col>
                </div>
                <div hidden={verifyDetails && !formData.pincode} className={RESPONSIVE_ROW_DIV_CLASS}>
                    <Col className={RESPONSIVE_COL_CLASS}>
                        <label
                               className={verifyDetails ? "custom-verify-text-label" : "custom-text-label"}
                               htmlFor="pinCode">
                            {t('registration.formDetails.pincodeLabel')}
                        </label>
                        <input className="form-control" name="pincode" id="pinCode" type="text"
                               hidden={verifyDetails}
                               placeholder={t('registration.formDetails.pincodePlaceholder')}
                               defaultValue={formData.pincode}
                               onBlur={setValue}
                        />
                        <div className="invalid-input">
                            {errors.pincode}
                        </div>
                        {
                            verifyDetails &&
                            <p>{formData.pincode}</p>
                        }
                    </Col>
                </div>
            </Row>
        </div>
    )
};
