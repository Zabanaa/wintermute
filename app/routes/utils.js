const handleError = (err, res) => {

    if (err.code === 11000) { // Duplicate Key Constraint

        let fieldName   = err.message.split(".$")[1]
        fieldName       = fieldName.split(" dup key")[0]
        fieldName       = fieldName.substring(0, fieldName.lastIndexOf("_"))
        errorMsg        = `A Character with this ${fieldName} already exists`
        return res.status(422).json({status: 422, error: errorMsg })
    }

    else if (err.message.includes(" validation failed")) { // Missing fields
        let missingFields = Object.keys(err.errors)
        return res.status(422).json({ status: 422, error: "Missing required fields", fields: missingFields })
    }

    else {
        return res.status(500).json({status: 500, error: "An error occured"})
    }
}

module.exports.handleError = handleError