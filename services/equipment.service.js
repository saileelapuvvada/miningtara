const { Equipment } = require("../models/equipment");
const { Favorite } = require("../models/favorite");
const ObjectId = require('mongoose').Types.ObjectId;


const equipmentService = {
  getEquipments: async (pageNumber, pageSize, user, filters, sortTime = false) => {
    const query = { ...filters };
    if (user && !user.isAdmin) {
      query.$or = [{ visibility: "public" }, { "author.id": user._id }];
    } else if (!user) {
      query.$or = [{ visibility: "public" }];
    }

    const sort = {}

    if (sortTime) {
      sort["created_date"] = -1
    }

    const [equipment, count] = await Promise.all([
      Equipment.find(query)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate("images")
        .sort(sort)
        .lean()
        .exec(),
      Equipment.countDocuments(query),
    ]).catch(function (err) {
      return [], 0;
    });

    return [equipment, count];
  },

  addFavoriteField: async (equiments, req) => {

    if (!req.isAuthenticated()) {
      return equiments
    }

    if (equiments && equiments.length > 0) {
      return await Promise.all(equiments.map(async item => {
        const Fav = await Favorite.findOne({
          'parent.id': new ObjectId(item._id),
          'author.id': new ObjectId(req.user._id)
        })
        if (Fav) {
          item.isFav = true
        } else {
          item.isFav = false
        }
        return item
      }))
    } else {
      return equiments
    }
  }
};

module.exports = equipmentService;
