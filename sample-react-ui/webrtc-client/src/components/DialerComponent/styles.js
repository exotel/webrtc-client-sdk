import { makeStyles } from "@material-ui/core";

const styles = makeStyles((theme) => ({
    phonesHeader: {
        color: '#2194FF',
        fontSize: 20,
        margin: theme.spacing(2),
        fontWeight: 'bold'
    },
    formControlLabel: {
        color: '#2194FF',
        fontSize: 17,
        fontWeight: 'bold'
    },
    options: {
        fontSize: 11,
        margin: theme.spacing(1)
    },
    iconbutton: {
        backgroundColor: 'inherit',
        width: 50,
        height:50,
        margin: 20,
        border:'white',
        borderRadius: 25,
    }
}));

export { styles };